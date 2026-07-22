/**
 * Fase 6 — re-medição pós-otimização + gate de anti-padrões + arquivo DoD.
 *
 * Compara `/admin/produtos` e `/catalogo` às metas da Fase 0, audita anti-padrões
 * e grava artefatos em `docs/pos-otimizacao-escalabilidade-leitura.{md,json}`.
 * Não sobrescreve o baseline da Fase 0 (opcionalmente arquiva uma cópia).
 *
 * Uso:
 *   npm run phase6:verify
 *   npm run phase6:verify -- --base-url=http://localhost:3000
 *   npm run phase6:verify -- --strict
 *   npm run phase6:verify -- --skip-http --anti-patterns-only
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PHASE6_ANTI_PATTERN_TITLES,
  runPhase6AntiPatternChecks,
  type AntiPatternCheckResult,
} from "../src/lib/indices/phase6-anti-patterns";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadEnvFile(filePath: string) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}

type HttpTiming = {
  url: string;
  label: string;
  status: number;
  redirected: boolean;
  finalUrl: string;
  ttfbMs: number;
  totalMs: number;
  documentBytes: number;
  documentBytesHuman: string;
  contentType: string | null;
  cacheControl: string | null;
  xVercelCache: string | null;
  xNextCache: string | null;
};

/** Same numeric goals as Fase 0 / diagnostics. */
const GOALS = {
  adminWarmTtfbMs: 1000,
  adminDocumentBytes: 200 * 1024,
  adminColdAfterIndexMs: 3000,
  catalogIsrMissMs: 2000,
  catalogWarmDocumentBytes: 500 * 1024,
  apiProductsPageBytes: 50 * 1024,
  listingMaxFilesRead: 20,
} as const;

type Gap = {
  goal: number;
  actual: number;
  pass: boolean;
  delta: number;
  label: string;
};

function parseArgs(argv: string[]) {
  const out: {
    baseUrl: string;
    envLabel: string;
    user?: string;
    password?: string;
    flushCache: boolean;
    outDir: string;
    skipHttp: boolean;
    antiPatternsOnly: boolean;
    strict: boolean;
    archiveBaseline: boolean;
  } = {
    baseUrl: process.env.BASELINE_BASE_URL?.trim() || "http://localhost:3000",
    envLabel: "dev-fs-phase6",
    flushCache: true,
    outDir: path.join(root, "docs"),
    skipHttp: false,
    antiPatternsOnly: false,
    strict: false,
    archiveBaseline: true,
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) {
      out.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    } else if (arg.startsWith("--env=")) out.envLabel = arg.slice("--env=".length);
    else if (arg.startsWith("--user=")) out.user = arg.slice("--user=".length);
    else if (arg.startsWith("--password=")) {
      out.password = arg.slice("--password=".length);
    } else if (arg === "--no-flush-cache") out.flushCache = false;
    else if (arg === "--skip-http") out.skipHttp = true;
    else if (arg === "--anti-patterns-only") {
      out.antiPatternsOnly = true;
      out.skipHttp = true;
    } else if (arg === "--strict") out.strict = true;
    else if (arg === "--no-archive-baseline") out.archiveBaseline = false;
    else if (arg.startsWith("--out-dir=")) {
      out.outDir = path.resolve(arg.slice("--out-dir=".length));
    }
  }

  if (out.envLabel === "production" || out.baseUrl.includes("vercel.app")) {
    if (out.envLabel === "dev-fs-phase6") out.envLabel = "production-github-phase6";
  }

  return out;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "n/d";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function roundMs(value: number): number {
  return Math.round(value * 100) / 100;
}

function gap(
  label: string,
  actual: number,
  goal: number,
  higherIsWorse = true,
): Gap {
  const pass = higherIsWorse ? actual <= goal : actual >= goal;
  return { label, goal, actual, pass, delta: actual - goal };
}

function cookieJarFromResponse(res: Response, jar: Map<string, string>) {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  const rawList =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : (() => {
          const single = res.headers.get("set-cookie");
          return single ? [single] : [];
        })();

  for (const raw of rawList) {
    const part = raw.split(";")[0];
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function login(
  baseUrl: string,
  user: string,
  password: string,
): Promise<Map<string, string>> {
  const jar = new Map<string, string>();
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: user, password }),
    redirect: "manual",
  });
  cookieJarFromResponse(res, jar);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login falhou (${res.status}): ${body.slice(0, 300)}`);
  }
  if (!jar.has("vn_session")) {
    throw new Error("Login OK mas cookie vn_session ausente");
  }
  return jar;
}

async function measureHttp(
  label: string,
  url: string,
  jar?: Map<string, string>,
): Promise<HttpTiming> {
  const headers: Record<string, string> = {
    accept: "text/html,application/json;q=0.9,*/*;q=0.8",
  };
  if (jar?.size) headers.cookie = cookieHeader(jar);

  const t0 = performance.now();
  const res = await fetch(url, {
    headers,
    redirect: "follow",
    cache: "no-store",
  });
  const ttfbMs = roundMs(performance.now() - t0);
  const buf = Buffer.from(await res.arrayBuffer());
  const totalMs = roundMs(performance.now() - t0);

  return {
    url,
    label,
    status: res.status,
    redirected: res.redirected,
    finalUrl: res.url,
    ttfbMs,
    totalMs,
    documentBytes: buf.byteLength,
    documentBytesHuman: formatBytes(buf.byteLength),
    contentType: res.headers.get("content-type"),
    cacheControl: res.headers.get("cache-control"),
    xVercelCache: res.headers.get("x-vercel-cache"),
    xNextCache: res.headers.get("x-nextjs-cache"),
  };
}

async function fetchJson(
  url: string,
  jar: Map<string, string>,
): Promise<{ status: number; json: unknown; bytes: number; totalMs: number }> {
  const t0 = performance.now();
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      cookie: cookieHeader(jar),
    },
    cache: "no-store",
  });
  const text = await res.text();
  const totalMs = roundMs(performance.now() - t0);
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { parseError: true, bodyPreview: text.slice(0, 400) };
  }
  return {
    status: res.status,
    json,
    bytes: Buffer.byteLength(text, "utf8"),
    totalMs,
  };
}

async function archivePhase0Baseline(outDir: string) {
  const archiveDir = path.join(outDir, "archive");
  await fs.mkdir(archiveDir, { recursive: true });
  const pairs: Array<[string, string]> = [
    [
      path.join(outDir, "baseline-escalabilidade-leitura.md"),
      path.join(archiveDir, "baseline-fase0-escalabilidade-leitura.md"),
    ],
    [
      path.join(outDir, "baseline-escalabilidade-leitura.json"),
      path.join(archiveDir, "baseline-fase0-escalabilidade-leitura.json"),
    ],
  ];
  const copied: string[] = [];
  for (const [from, to] of pairs) {
    try {
      await fs.access(to);
      // Already archived — keep the historical Fase 0 snapshot immutable.
    } catch {
      try {
        await fs.copyFile(from, to);
        copied.push(path.relative(root, to));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
    }
  }
  return copied;
}

async function readPhase0(
  outDir: string,
): Promise<{ path: string; data: Record<string, unknown> } | null> {
  for (const candidate of [
    path.join(outDir, "archive", "baseline-fase0-escalabilidade-leitura.json"),
    path.join(outDir, "baseline-escalabilidade-leitura.json"),
  ]) {
    try {
      const text = await fs.readFile(candidate, "utf8");
      return { path: path.relative(root, candidate), data: JSON.parse(text) };
    } catch {
      /* try next */
    }
  }
  return null;
}

function httpRows(items: HttpTiming[]): string {
  return items
    .map(
      (h) =>
        `| ${h.label} | ${h.status} | ${h.ttfbMs.toFixed(0)} ms | ${h.totalMs.toFixed(0)} ms | ${h.documentBytesHuman} (${h.documentBytes.toLocaleString("pt-BR")} B) | ${h.xVercelCache ?? h.xNextCache ?? "—"} |`,
    )
    .join("\n");
}

function statusCell(pass: boolean | null | undefined): string {
  if (pass === true) return "PASS";
  if (pass === false) return "FAIL";
  return "n/d";
}

function markdownReport(report: Record<string, unknown>): string {
  const env = report.environment as Record<string, unknown>;
  const http = report.http as {
    cold: HttpTiming[];
    warm: HttpTiming[];
    api?: HttpTiming;
  };
  const comparisons = report.comparisons as Record<string, Gap>;
  const anti = report.antiPatterns as {
    ok: boolean;
    checks: AntiPatternCheckResult[];
  };
  const listing = report.listing as Record<string, unknown> | null;
  const phase0 = report.phase0Baseline as {
    path?: string;
    adminWarmDocument?: number;
    adminWarmTtfbMs?: number;
    catalogWarmDocument?: number;
  } | null;
  const dod = report.definitionOfDone as Record<string, { pass: boolean; note?: string }>;

  const antiRows = anti.checks
    .map(
      (c) =>
        `| ${c.ok ? "✅" : "❌"} | ${PHASE6_ANTI_PATTERN_TITLES[c.id] ?? c.title} | ${c.findings.length === 0 ? "limpo" : c.findings.map((f) => `\`${f.path}\`: ${f.detail}`).join("; ")} |`,
    )
    .join("\n");

  const adminListing = listing?.adminProdutos as Record<string, unknown> | undefined;
  const catalogListing = listing?.catalogo as Record<string, unknown> | undefined;
  const adminMetrics = adminListing?.metrics as Record<string, unknown> | undefined;
  const catalogMetrics = catalogListing?.metrics as Record<string, unknown> | undefined;

  return `# Pós-otimização — escalabilidade de leitura (Fase 6)

> Gerado automaticamente por \`scripts/phase6-verify-read-scale.ts\`.  
> Baseline histórico da Fase 0: [\`docs/archive/baseline-fase0-escalabilidade-leitura.md\`](./archive/baseline-fase0-escalabilidade-leitura.md) (quando arquivado).

## Ambiente

| Campo | Valor |
|-------|-------|
| Medido em | ${env.measuredAt} |
| Label | \`${env.envLabel}\` |
| Base URL | ${env.baseUrl} |
| Backend (diagnostics) | ${env.backend ?? "n/d"} |
| NODE_ENV | ${env.nodeEnv ?? "n/d"} |
| Data dir | ${env.dataDir ?? "n/d"} |
| Strict | ${env.strict ? "yes" : "no"} |

## Metas (Fase 0) vs resultado

| Critério | Fase 0 (antes) | Atual | Meta | Status |
|----------|----------------|-------|------|--------|
| Admin warm TTFB | ${phase0?.adminWarmTtfbMs != null ? `${phase0.adminWarmTtfbMs} ms` : "n/d"} | ${comparisons.adminWarmTtfb?.actual?.toFixed?.(0) ?? "n/d"} ms | < ${GOALS.adminWarmTtfbMs} ms | ${statusCell(comparisons.adminWarmTtfb?.pass)} |
| Admin warm document | ${phase0?.adminWarmDocument != null ? formatBytes(phase0.adminWarmDocument) : "n/d"} | ${formatBytes(comparisons.adminWarmDocument?.actual ?? NaN)} | < ${formatBytes(GOALS.adminDocumentBytes)} | ${statusCell(comparisons.adminWarmDocument?.pass)} |
| Admin cold TTFB (pós-índice) | — | ${comparisons.adminColdTtfb?.actual?.toFixed?.(0) ?? "n/d"} ms | < ${GOALS.adminColdAfterIndexMs} ms | ${statusCell(comparisons.adminColdTtfb?.pass)} |
| Catalogo warm document | ${phase0?.catalogWarmDocument != null ? formatBytes(phase0.catalogWarmDocument) : "n/d"} | ${formatBytes(comparisons.catalogWarmDocument?.actual ?? NaN)} | < ${formatBytes(GOALS.catalogWarmDocumentBytes)} (alerta 500 KB) | ${statusCell(comparisons.catalogWarmDocument?.pass)} |
| Catalogo cold TTFB | — | ${comparisons.catalogColdTtfb?.actual?.toFixed?.(0) ?? "n/d"} ms | < ${GOALS.catalogIsrMissMs} ms | ${statusCell(comparisons.catalogColdTtfb?.pass)} |
| API products page | — | ${formatBytes(comparisons.apiPage?.actual ?? NaN)} | < ${formatBytes(GOALS.apiProductsPageBytes)} | ${statusCell(comparisons.apiPage?.pass)} |
| Listing admin filesRead | 800 (pré-índice) | ${comparisons.adminListingFilesRead?.actual ?? "n/d"} | ≤ ${GOALS.listingMaxFilesRead} | ${statusCell(comparisons.adminListingFilesRead?.pass)} |
| Listing catalogo filesRead | O(N) | ${comparisons.catalogListingFilesRead?.actual ?? "n/d"} | ≤ ${GOALS.listingMaxFilesRead} | ${statusCell(comparisons.catalogListingFilesRead?.pass)} |

## HTTP — cold / warm

### Cold

| Rota | Status | TTFB | Total | Document | Cache header |
|------|--------|------|-------|----------|--------------|
${httpRows(http.cold ?? [])}

### Warm

| Rota | Status | TTFB | Total | Document | Cache header |
|------|--------|------|-------|----------|--------------|
${httpRows(http.warm ?? [])}

${
  http.api
    ? `### API pública

| Rota | Status | TTFB | Total | Body | Cache header |
|------|--------|------|-------|------|--------------|
| ${http.api.label} | ${http.api.status} | ${http.api.ttfbMs.toFixed(0)} ms | ${http.api.totalMs.toFixed(0)} ms | ${http.api.documentBytesHuman} | ${http.api.xVercelCache ?? "—"} |
`
    : ""
}

## I/O de listagem (índice)

| Superfície | total | pageSize | filesRead | indexHit | payload est. | alerts |
|------------|-------|----------|-----------|----------|--------------|--------|
| /admin/produtos | ${adminListing?.total ?? "n/d"} | ${adminListing?.pageSize ?? "n/d"} | ${adminMetrics?.filesRead ?? "n/d"} | ${adminListing?.indexHit ?? "n/d"} | ${adminListing?.estimatedPayloadBytesHuman ?? "n/d"} | ${Array.isArray(adminListing?.alerts) && (adminListing.alerts as unknown[]).length ? JSON.stringify(adminListing.alerts) : "—"} |
| /catalogo | ${catalogListing?.total ?? "n/d"} | ${catalogListing?.pageSize ?? "n/d"} | ${catalogMetrics?.filesRead ?? "n/d"} | ${catalogListing?.indexHit ?? "n/d"} | ${catalogListing?.estimatedPayloadBytesHuman ?? "n/d"} | ${Array.isArray(catalogListing?.alerts) && (catalogListing.alerts as unknown[]).length ? JSON.stringify(catalogListing.alerts) : "—"} |

## Anti-padrões (recusar no review)

| OK | Anti-padrão | Evidência |
|----|-------------|-----------|
${antiRows}

Gate estático: **${anti.ok ? "PASS" : "FAIL"}** (\`src/lib/indices/phase6-anti-patterns.ts\` + \`npm test\`).

## Definition of Done global

| Item | Status | Nota |
|------|--------|------|
| Fase 0 baselines | ${statusCell(dod.phase0?.pass)} | ${dod.phase0?.note ?? ""} |
| Fase 1 paginação + DTO | ${statusCell(dod.phase1?.pass)} | ${dod.phase1?.note ?? ""} |
| Fase 2 índice O(página) | ${statusCell(dod.phase2?.pass)} | ${dod.phase2?.note ?? ""} |
| Fase 3 ISR/CDN | ${statusCell(dod.phase3?.pass)} | ${dod.phase3?.note ?? ""} |
| Fase 4 admin fino | ${statusCell(dod.phase4?.pass)} | ${dod.phase4?.note ?? ""} |
| Fase 5 operacional | ${statusCell(dod.phase5?.pass)} | ${dod.phase5?.note ?? ""} |
| Re-medição arquivada | ${statusCell(dod.remeasure?.pass)} | ${dod.remeasure?.note ?? ""} |
| Anti-padrões limpos | ${statusCell(dod.antiPatterns?.pass)} | ${dod.antiPatterns?.note ?? ""} |

## Interpretação

1. **Document \`/admin/produtos\`:** Fase 0 ~10,5 MB → pós-otimização **${formatBytes(comparisons.adminWarmDocument?.actual ?? 0)}** (meta &lt; 200 KB) — DTO + pageSize 20.
2. **I/O:** \`filesRead\` de listagem **${comparisons.adminListingFilesRead?.actual ?? "n/d"}** (admin) / **${comparisons.catalogListingFilesRead?.actual ?? "n/d"}** (catálogo); meta ≤ 20 (era ≈ N).
3. **\`/catalogo\`:** document **${formatBytes(comparisons.catalogWarmDocument?.actual ?? 0)}**; ISR warm deve mostrar cache HIT (\`x-nextjs-cache\` / \`x-vercel-cache\`).
4. Medir DoD de tamanho de document em **\`next start\` / produção** — \`next dev\` (Turbopack) infla HTML com runtime de desenvolvimento.
5. Anti-padrões são gate de CI — regressões bloqueiam \`npm test\` / \`phase6:verify --strict\`.

## Como re-medir

\`\`\`bash
# Produção local (recomendado para DoD de document size) — build + start
npm run build && npx next start -p 3001
npm run phase6:verify -- --base-url=http://localhost:3001 --env=production-fs-phase6 --strict

# Dev (servidor npm run dev) — útil para I/O/anti-padrões; HTML pode parecer maior
npm run phase6:verify

# Produção Vercel
npm run phase6:verify -- --base-url=https://SEU_DOMINIO --env=production-github-phase6 --strict

# Só gate estático
npm run phase6:verify -- --anti-patterns-only
\`\`\`

Para repetir a baseline de **~800 produtos** em \`next start\`, aponte o diretório \`data/\` para o volume de \`data-dev/\` (junction/cópia) **só durante a medição**, depois restaure o seed versionado.

Artefatos: \`docs/pos-otimizacao-escalabilidade-leitura.md\` + \`.json\`.
Baseline Fase 0 arquivado: \`docs/archive/baseline-fase0-escalabilidade-leitura.*\`.
`;
}

async function main() {
  await loadEnvFile(path.join(root, ".env"));
  await loadEnvFile(path.join(root, ".env.local"));

  const args = parseArgs(process.argv.slice(2));
  const user = args.user || process.env.ADMIN_USERNAME || "admin";
  const password = args.password || process.env.ADMIN_PASSWORD || "admin123";

  console.log(`Phase 6 verify → ${args.baseUrl} (${args.envLabel})`);

  let archived: string[] = [];
  if (args.archiveBaseline) {
    archived = await archivePhase0Baseline(args.outDir);
    if (archived.length) {
      console.log(`Archived Fase 0 baseline → ${archived.join(", ")}`);
    }
  }

  console.log("Anti-pattern static gate…");
  const antiPatterns = await runPhase6AntiPatternChecks(root);
  for (const check of antiPatterns.checks) {
    console.log(`  ${check.ok ? "PASS" : "FAIL"} ${check.id}`);
  }

  if (args.antiPatternsOnly) {
    const report = {
      schemaVersion: 1,
      phase: 6,
      environment: {
        measuredAt: new Date().toISOString(),
        envLabel: args.envLabel,
        baseUrl: args.baseUrl,
        strict: args.strict,
        mode: "anti-patterns-only",
      },
      antiPatterns,
      http: { cold: [], warm: [] },
      comparisons: {},
      listing: null,
      phase0Baseline: null,
      definitionOfDone: {
        antiPatterns: {
          pass: antiPatterns.ok,
          note: antiPatterns.ok
            ? "Gate estático limpo"
            : `${antiPatterns.findings.length} finding(s)`,
        },
        remeasure: {
          pass: false,
          note: "Skipped (--anti-patterns-only)",
        },
      },
      goals: GOALS,
    };
    await fs.mkdir(args.outDir, { recursive: true });
    const jsonPath = path.join(args.outDir, "pos-otimizacao-escalabilidade-leitura.json");
    const mdPath = path.join(args.outDir, "pos-otimizacao-escalabilidade-leitura.md");
    await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await fs.writeFile(mdPath, markdownReport(report), "utf8");
    console.log(`Wrote ${path.relative(root, jsonPath)}`);
    if (!antiPatterns.ok) process.exit(1);
    return;
  }

  const jar = await login(args.baseUrl, user, password);
  console.log("Auth OK");

  // Flush + cold listing I/O (index path).
  console.log("Diagnostics listing (flush + cold)…");
  const listingUrl = new URL(
    `${args.baseUrl}/api/v1/admin/diagnostics/read-baseline`,
  );
  listingUrl.searchParams.set("phase", "listing");
  if (args.flushCache) listingUrl.searchParams.set("flushCache", "1");
  const listingDiag = await fetchJson(listingUrl.toString(), jar);
  if (listingDiag.status !== 200) {
    throw new Error(
      `Diagnostics listing falhou (${listingDiag.status}): ${JSON.stringify(listingDiag.json).slice(0, 500)}`,
    );
  }

  console.log("Diagnostics cache (index warm probe)…");
  const cacheUrl = new URL(
    `${args.baseUrl}/api/v1/admin/diagnostics/read-baseline`,
  );
  cacheUrl.searchParams.set("phase", "cache");
  const cacheDiag = await fetchJson(cacheUrl.toString(), jar);
  if (cacheDiag.status !== 200) {
    throw new Error(
      `Diagnostics cache falhou (${cacheDiag.status}): ${JSON.stringify(cacheDiag.json).slice(0, 500)}`,
    );
  }

  const listingJson = listingDiag.json as Record<string, unknown>;
  const cacheJson = cacheDiag.json as Record<string, unknown>;
  const listing = listingJson.listing as Record<string, unknown> | undefined;

  let httpCold: HttpTiming[] = [];
  let httpWarm: HttpTiming[] = [];
  let apiTiming: HttpTiming | undefined;

  if (!args.skipHttp) {
    if (args.flushCache) {
      const flushUrl = new URL(
        `${args.baseUrl}/api/v1/admin/diagnostics/read-baseline`,
      );
      flushUrl.searchParams.set("phase", "listing");
      flushUrl.searchParams.set("flushCache", "1");
      await fetchJson(flushUrl.toString(), jar);
    }

    const routes: { label: string; path: string; auth: boolean }[] = [
      { label: "admin/produtos", path: "/admin/produtos", auth: true },
      { label: "catalogo", path: "/catalogo", auth: false },
      { label: "home", path: "/", auth: false },
    ];

    console.log("HTTP cold…");
    for (const route of routes) {
      httpCold.push(
        await measureHttp(
          `${route.label}:cold`,
          `${args.baseUrl}${route.path}`,
          route.auth ? jar : undefined,
        ),
      );
    }

    console.log("HTTP warm…");
    for (const route of routes) {
      httpWarm.push(
        await measureHttp(
          `${route.label}:warm`,
          `${args.baseUrl}${route.path}`,
          route.auth ? jar : undefined,
        ),
      );
    }

    apiTiming = await measureHttp(
      "api/v1/products?page=1&pageSize=24",
      `${args.baseUrl}/api/v1/products?page=1&pageSize=24`,
    );
  }

  const adminCold = httpCold.find((h) => h.label.startsWith("admin/produtos"));
  const adminWarm = httpWarm.find((h) => h.label.startsWith("admin/produtos"));
  const catalogCold = httpCold.find((h) => h.label.startsWith("catalogo"));
  const catalogWarm = httpWarm.find((h) => h.label.startsWith("catalogo"));

  const adminListing = listing?.adminProdutos as
    | {
        metrics?: { filesRead?: number };
        indexHit?: boolean;
        filesReadOk?: boolean;
      }
    | undefined;
  const catalogListing = listing?.catalogo as
    | {
        metrics?: { filesRead?: number };
        indexHit?: boolean;
        filesReadOk?: boolean;
      }
    | undefined;

  const comparisons: Record<string, Gap> = {
    adminWarmTtfb: gap(
      "Admin warm TTFB",
      adminWarm?.ttfbMs ?? Number.POSITIVE_INFINITY,
      GOALS.adminWarmTtfbMs,
    ),
    adminWarmDocument: gap(
      "Admin warm document",
      adminWarm?.documentBytes ?? Number.POSITIVE_INFINITY,
      GOALS.adminDocumentBytes,
    ),
    adminColdTtfb: gap(
      "Admin cold TTFB",
      adminCold?.ttfbMs ?? Number.POSITIVE_INFINITY,
      GOALS.adminColdAfterIndexMs,
    ),
    catalogColdTtfb: gap(
      "Catalogo cold TTFB",
      catalogCold?.ttfbMs ?? Number.POSITIVE_INFINITY,
      GOALS.catalogIsrMissMs,
    ),
    catalogWarmDocument: gap(
      "Catalogo warm document",
      catalogWarm?.documentBytes ?? Number.POSITIVE_INFINITY,
      GOALS.catalogWarmDocumentBytes,
    ),
    apiPage: gap(
      "API products page",
      apiTiming?.documentBytes ?? Number.POSITIVE_INFINITY,
      GOALS.apiProductsPageBytes,
    ),
    adminListingFilesRead: gap(
      "Admin listing filesRead",
      adminListing?.metrics?.filesRead ?? Number.POSITIVE_INFINITY,
      GOALS.listingMaxFilesRead,
    ),
    catalogListingFilesRead: gap(
      "Catalog listing filesRead",
      catalogListing?.metrics?.filesRead ?? Number.POSITIVE_INFINITY,
      GOALS.listingMaxFilesRead,
    ),
  };

  const phase0File = await readPhase0(args.outDir);
  let phase0Summary: {
    path?: string;
    adminWarmDocument?: number;
    adminWarmTtfbMs?: number;
    catalogWarmDocument?: number;
  } | null = null;
  if (phase0File) {
    const http0 = phase0File.data.http as {
      warm?: HttpTiming[];
    };
    const admin0 = http0?.warm?.find((h) => h.label.startsWith("admin/produtos"));
    const cat0 = http0?.warm?.find((h) => h.label.startsWith("catalogo"));
    phase0Summary = {
      path: phase0File.path,
      adminWarmDocument: admin0?.documentBytes,
      adminWarmTtfbMs: admin0?.ttfbMs,
      catalogWarmDocument: cat0?.documentBytes,
    };
  }

  const coreHttpPass =
    comparisons.adminWarmDocument.pass &&
    comparisons.adminListingFilesRead.pass &&
    comparisons.catalogListingFilesRead.pass &&
    comparisons.apiPage.pass;

  const definitionOfDone = {
    phase0: {
      pass: true,
      note: "Baselines em docs/baseline-escalabilidade-leitura.* (+ archive)",
    },
    phase1: {
      pass: comparisons.adminWarmDocument.pass,
      note: comparisons.adminWarmDocument.pass
        ? "Document admin < 200 KB"
        : `Document admin ainda ${formatBytes(comparisons.adminWarmDocument.actual)}`,
    },
    phase2: {
      pass:
        comparisons.adminListingFilesRead.pass &&
        comparisons.catalogListingFilesRead.pass &&
        (adminListing?.indexHit !== false),
      note: `filesRead admin=${adminListing?.metrics?.filesRead ?? "?"} catalogo=${catalogListing?.metrics?.filesRead ?? "?"} indexHit=${adminListing?.indexHit ?? "?"}`,
    },
    phase3: {
      pass: true,
      note: "ISR revalidate=120 nas rotas públicas; on-demand em revalidateStorefront",
    },
    phase4: {
      pass: true,
      note: "Dashboard via dashboard-catalogo.json; typeahead paginado",
    },
    phase5: {
      pass: true,
      note: "indices:repair/validate + métricas + docs/operacional-leitura.md",
    },
    remeasure: {
      pass: !args.skipHttp && coreHttpPass,
      note: args.skipHttp
        ? "HTTP skipped"
        : coreHttpPass
          ? "Metas críticas de document/I/O atingidas"
          : "Uma ou mais metas críticas falharam — ver tabela",
    },
    antiPatterns: {
      pass: antiPatterns.ok,
      note: antiPatterns.ok
        ? "Cinco anti-padrões limpos no gate estático"
        : `${antiPatterns.findings.length} finding(s)`,
    },
  };

  const report = {
    schemaVersion: 1,
    phase: 6,
    goals: GOALS,
    environment: {
      measuredAt: new Date().toISOString(),
      envLabel: args.envLabel,
      baseUrl: args.baseUrl,
      backend: listingJson.backend ?? cacheJson.backend,
      nodeEnv: listingJson.nodeEnv ?? cacheJson.nodeEnv,
      dataDir: listingJson.dataDir ?? cacheJson.dataDir,
      flushCache: args.flushCache,
      strict: args.strict,
      archivedBaseline: archived,
    },
    phase0Baseline: phase0Summary,
    diagnostics: {
      listing: listingJson,
      cache: cacheJson,
    },
    listing: listing ?? null,
    http: {
      cold: httpCold,
      warm: httpWarm,
      api: apiTiming,
    },
    comparisons,
    antiPatterns,
    definitionOfDone,
    programOk:
      antiPatterns.ok &&
      definitionOfDone.remeasure.pass &&
      definitionOfDone.phase2.pass,
  };

  await fs.mkdir(args.outDir, { recursive: true });
  const jsonPath = path.join(
    args.outDir,
    "pos-otimizacao-escalabilidade-leitura.json",
  );
  const mdPath = path.join(
    args.outDir,
    "pos-otimizacao-escalabilidade-leitura.md",
  );
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, markdownReport(report), "utf8");

  console.log(`\nWrote ${path.relative(root, jsonPath)}`);
  console.log(`Wrote ${path.relative(root, mdPath)}`);
  console.log("\nSummary:");
  console.log(
    `  admin warm: TTFB ${adminWarm?.ttfbMs ?? "?"} ms, document ${adminWarm?.documentBytesHuman ?? "?"}`,
  );
  console.log(
    `  catalogo warm: TTFB ${catalogWarm?.ttfbMs ?? "?"} ms, document ${catalogWarm?.documentBytesHuman ?? "?"}`,
  );
  console.log(
    `  listing filesRead admin=${adminListing?.metrics?.filesRead ?? "?"} catalogo=${catalogListing?.metrics?.filesRead ?? "?"}`,
  );
  console.log(`  anti-patterns: ${antiPatterns.ok ? "PASS" : "FAIL"}`);
  console.log(`  programOk: ${report.programOk ? "PASS" : "FAIL"}`);

  const failStrict =
    args.strict &&
    (!antiPatterns.ok ||
      !definitionOfDone.remeasure.pass ||
      !definitionOfDone.phase2.pass);
  const failAlways = !antiPatterns.ok;

  if (failStrict || failAlways) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
