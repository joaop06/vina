/**
 * Phase 0 — baseline de leitura (FS local ou URL de produção).
 *
 * Mede:
 * - I/O de `listAllProducts` / cache hit-miss via diagnostics admin
 * - TTFB, tempo total e tamanho do document de rotas HTML
 * - Tamanho da resposta paginada da API pública
 *
 * Uso:
 *   npm run baseline:read
 *   npm run baseline:read -- --base-url=http://localhost:3000
 *   npm run baseline:read -- --base-url=https://seu-dominio.vercel.app --env=production
 *
 * Credenciais admin: ADMIN_USERNAME / ADMIN_PASSWORD (ou --user / --password).
 * Em produção Vercel (DATA_BACKEND=github), rode com --flush-cache na primeira
 * medição cold e compare com warm na sequência.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

type Goals = {
  adminWarmTtfbMs: number;
  adminDocumentBytes: number;
  adminColdAfterIndexMs: number;
  catalogIsrMissMs: number;
  apiProductsPageBytes: number;
};

const GOALS: Goals = {
  adminWarmTtfbMs: 1000,
  adminDocumentBytes: 200 * 1024,
  adminColdAfterIndexMs: 3000,
  catalogIsrMissMs: 2000,
  apiProductsPageBytes: 50 * 1024,
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
  } = {
    baseUrl: process.env.BASELINE_BASE_URL?.trim() || "http://localhost:3000",
    envLabel: "dev-fs",
    flushCache: true,
    outDir: path.join(root, "docs"),
    skipHttp: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) out.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    else if (arg.startsWith("--env=")) out.envLabel = arg.slice("--env=".length);
    else if (arg.startsWith("--user=")) out.user = arg.slice("--user=".length);
    else if (arg.startsWith("--password=")) out.password = arg.slice("--password=".length);
    else if (arg === "--no-flush-cache") out.flushCache = false;
    else if (arg === "--skip-http") out.skipHttp = true;
    else if (arg.startsWith("--out-dir=")) out.outDir = path.resolve(arg.slice("--out-dir=".length));
  }

  if (out.envLabel === "production" || out.baseUrl.includes("vercel.app")) {
    if (out.envLabel === "dev-fs") out.envLabel = "production-github";
  }

  return out;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function roundMs(value: number): number {
  return Math.round(value * 100) / 100;
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
  if (!jar.has("pq_session")) {
    throw new Error("Login OK mas cookie pq_session ausente");
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

function gapVsGoal(
  actual: number,
  goal: number,
  higherIsWorse = true,
): { goal: number; actual: number; pass: boolean; delta: number } {
  const pass = higherIsWorse ? actual <= goal : actual >= goal;
  return { goal, actual, pass, delta: actual - goal };
}

function markdownReport(report: Record<string, unknown>): string {
  const env = report.environment as Record<string, unknown>;
  const http = report.http as {
    cold: HttpTiming[];
    warm: HttpTiming[];
    api?: HttpTiming;
  };
  const diagnostics = report.diagnostics as Record<string, unknown> | null;
  const comparisons = report.comparisons as Record<string, unknown>;

  const rows = (items: HttpTiming[]) =>
    items
      .map(
        (h) =>
          `| ${h.label} | ${h.status} | ${h.ttfbMs.toFixed(0)} ms | ${h.totalMs.toFixed(0)} ms | ${h.documentBytesHuman} (${h.documentBytes.toLocaleString("pt-BR")} B) | ${h.xVercelCache ?? h.xNextCache ?? "—"} |`,
      )
      .join("\n");

  const io = (diagnostics as { io?: { listAllProducts?: { metrics?: Record<string, unknown>; productCount?: number } } } | null)
    ?.io?.listAllProducts;
  const cache = (diagnostics as {
    cache?: {
      cold?: { cacheOutcome?: string; metrics?: Record<string, unknown> };
      warm?: { cacheOutcome?: string; metrics?: Record<string, unknown> };
      publicApiPageEstimate?: { payloadBytes?: number; payloadBytesHuman?: string };
    };
  } | null)?.cache;

  return `# Baseline — escalabilidade de leitura (Fase 0)

> Gerado automaticamente por \`scripts/baseline-read-perf.ts\`.  
> Não editar à mão a seção **Resultados medidos**; re-rode o script para atualizar.

## Ambiente

| Campo | Valor |
|-------|-------|
| Medido em | ${env.measuredAt} |
| Label | \`${env.envLabel}\` |
| Base URL | ${env.baseUrl} |
| Backend (diagnostics) | ${env.backend ?? "n/d"} |
| NODE_ENV (diagnostics) | ${env.nodeEnv ?? "n/d"} |
| Data dir | ${env.dataDir ?? "n/d"} |
| Produtos (I/O) | ${io?.productCount ?? "n/d"} |

## Metas (Definition of Done do programa)

| Superfície | Meta |
|------------|------|
| Admin listagem (cache quente) | < 1 s TTFB; document < 200 KB |
| Admin listagem (cold, pós-índice) | < 3 s; poucas leituras (não N) |
| \`/catalogo\` e home (ISR/CDN) | HTML da CDN; miss regeneração < 2 s |
| API \`GET /api/v1/products\` | Página típica < 50 KB |

## Resultados medidos — HTTP

### Cold (após flush de tag \`products\` quando aplicável)

| Rota | Status | TTFB | Total | Document | Cache header |
|------|--------|------|-------|----------|--------------|
${rows(http.cold)}

### Warm (request imediato seguinte)

| Rota | Status | TTFB | Total | Document | Cache header |
|------|--------|------|-------|----------|--------------|
${rows(http.warm)}

${
  http.api
    ? `### API pública paginada

| Rota | Status | TTFB | Total | Body | Cache header |
|------|--------|------|-------|------|--------------|
| ${http.api.label} | ${http.api.status} | ${http.api.ttfbMs.toFixed(0)} ms | ${http.api.totalMs.toFixed(0)} ms | ${http.api.documentBytesHuman} | ${http.api.xVercelCache ?? "—"} |
`
    : ""
}

## Resultados medidos — I/O e Data Cache

### \`listAllProducts\` (bypass de cache de página; I/O real)

| Métrica | Valor |
|---------|-------|
| durationMs | ${io?.metrics?.durationMs ?? "n/d"} |
| filesRead | ${io?.metrics?.filesRead ?? "n/d"} |
| bytesRead | ${io?.metrics?.bytesReadHuman ?? "n/d"} (${io?.metrics?.bytesRead ?? "n/d"} B) |
| listDirCalls | ${io?.metrics?.listDirCalls ?? "n/d"} |
| readJsonCount | ${io?.metrics?.readJsonCount ?? "n/d"} |
| readJsonMs | ${io?.metrics?.readJsonMs ?? "n/d"} |
| listJsonDirMs | ${io?.metrics?.listJsonDirMs ?? "n/d"} |

### \`unstable_cache\` tag \`products\` (revalidate 120s)

| Chamada | Outcome | durationMs | filesRead | bytesRead |
|---------|---------|------------|-----------|-----------|
| cold | ${cache?.cold?.cacheOutcome ?? "n/d"} | ${cache?.cold?.metrics?.durationMs ?? "n/d"} | ${cache?.cold?.metrics?.filesRead ?? "n/d"} | ${cache?.cold?.metrics?.bytesReadHuman ?? "n/d"} |
| warm | ${cache?.warm?.cacheOutcome ?? "n/d"} | ${cache?.warm?.metrics?.durationMs ?? "n/d"} | ${cache?.warm?.metrics?.filesRead ?? "n/d"} | ${cache?.warm?.metrics?.bytesReadHuman ?? "n/d"} |

Payload estimado \`listCachedPublicProducts({ page:1, pageSize:24 })\`: **${cache?.publicApiPageEstimate?.payloadBytesHuman ?? "n/d"}** (${cache?.publicApiPageEstimate?.payloadBytes ?? "n/d"} B) — ainda materializa lista completa antes do slice (dívida Fase 1–2).

## Comparação atual vs metas

| Critério | Atual | Meta | Status |
|----------|-------|------|--------|
| Admin warm TTFB | ${(comparisons as { adminWarmTtfb?: { actual: number; pass: boolean } }).adminWarmTtfb?.actual?.toFixed?.(0) ?? "n/d"} ms | < ${GOALS.adminWarmTtfbMs} ms | ${(comparisons as { adminWarmTtfb?: { pass: boolean } }).adminWarmTtfb?.pass ? "PASS" : "FAIL (esperado pré-otimização)"} |
| Admin warm document | ${formatBytes((comparisons as { adminWarmDocument?: { actual: number } }).adminWarmDocument?.actual ?? 0)} | < ${formatBytes(GOALS.adminDocumentBytes)} | ${(comparisons as { adminWarmDocument?: { pass: boolean } }).adminWarmDocument?.pass ? "PASS" : "FAIL (esperado pré-otimização)"} |
| Admin cold TTFB | ${(comparisons as { adminColdTtfb?: { actual: number } }).adminColdTtfb?.actual?.toFixed?.(0) ?? "n/d"} ms | < ${GOALS.adminColdAfterIndexMs} ms (pós-índice) | ${(comparisons as { adminColdTtfb?: { pass: boolean } }).adminColdTtfb?.pass ? "PASS" : "FAIL (baseline; meta vale após Fase 2)"} |
| API products page | ${formatBytes((comparisons as { apiPage?: { actual: number } }).apiPage?.actual ?? 0)} | < ${formatBytes(GOALS.apiProductsPageBytes)} | ${(comparisons as { apiPage?: { pass: boolean } }).apiPage?.pass ? "PASS" : "FAIL (esperado pré-otimização)"} |
| Cache warm filesRead | ${(comparisons as { cacheWarmFilesRead?: { actual: number } }).cacheWarmFilesRead?.actual ?? "n/d"} | 0 (hit) | ${(comparisons as { cacheWarmFilesRead?: { pass: boolean } }).cacheWarmFilesRead?.pass ? "PASS" : "FAIL"} |
| Cache cold ≈ N files | ${(comparisons as { cacheColdFilesRead?: { actual: number } }).cacheColdFilesRead?.actual ?? "n/d"} | = productCount (hoje) | documentado |

## Interpretação (congelada na Fase 0)

1. **Document HTML de \`/admin/produtos\`** serializa o catálogo completo no RSC payload — daí o ~MB observado.
2. **Cold Data Cache** executa \`listJsonDir\` + **N × \`readJson\`** (\`filesRead ≈ productCount\`).
3. Se **warm** também for \`miss\` com \`filesRead ≈ N\` e \`bytesRead ≳ 1.5 MB\`, o Next.js Data Cache provavelmente **rejeitou** a entrada (limite **2 MB**). Hit só volta após DTO/índice (Fases 1–2).
4. Em **produção GitHub**, o cold path multiplica o custo por latência da Contents API (pior caso do programa).
5. Inventário de call sites: [\`docs/backlog-call-sites-catalogo-completo.md\`](./backlog-call-sites-catalogo-completo.md).

## Produção Vercel (\`DATA_BACKEND=github\`)

Re-rode com \`--env=production-github --base-url=https://…\` e arquive a corrida \`dev-fs\` antes se precisar dos dois baselines.

## Como re-medir

\`\`\`bash
# Dev (FS, data-dev) — servidor \`npm run dev\` no ar
npm run baseline:read

# Produção Vercel (DATA_BACKEND=github)
npm run baseline:read -- --base-url=https://SEU_DOMINIO --env=production-github --user=... --password=...
\`\`\`

Artefatos: \`docs/baseline-escalabilidade-leitura.md\` + \`.json\`.
Diagnostics: \`GET /api/v1/admin/diagnostics/read-baseline?phase=all&flushCache=1\`.
`;
}

async function main() {
  await loadEnvFile(path.join(root, ".env"));
  await loadEnvFile(path.join(root, ".env.local"));

  const args = parseArgs(process.argv.slice(2));
  const user = args.user || process.env.ADMIN_USERNAME || "admin";
  const password = args.password || process.env.ADMIN_PASSWORD || "admin123";

  console.log(`Baseline Phase 0 → ${args.baseUrl} (${args.envLabel})`);

  const jar = await login(args.baseUrl, user, password);
  console.log("Auth OK");

  console.log("Diagnostics cache (flush)…");
  const cacheUrl = new URL(`${args.baseUrl}/api/v1/admin/diagnostics/read-baseline`);
  cacheUrl.searchParams.set("phase", "cache");
  if (args.flushCache) cacheUrl.searchParams.set("flushCache", "1");
  const cacheDiag = await fetchJson(cacheUrl.toString(), jar);
  if (cacheDiag.status !== 200) {
    throw new Error(
      `Diagnostics cache falhou (${cacheDiag.status}): ${JSON.stringify(cacheDiag.json).slice(0, 500)}`,
    );
  }

  console.log("Diagnostics I/O direto…");
  const ioUrl = new URL(`${args.baseUrl}/api/v1/admin/diagnostics/read-baseline`);
  ioUrl.searchParams.set("phase", "io");
  const ioDiag = await fetchJson(ioUrl.toString(), jar);
  if (ioDiag.status !== 200) {
    throw new Error(
      `Diagnostics I/O falhou (${ioDiag.status}): ${JSON.stringify(ioDiag.json).slice(0, 500)}`,
    );
  }

  const cacheJson = cacheDiag.json as Record<string, unknown>;
  const ioJson = ioDiag.json as Record<string, unknown>;
  const diagnostics: Record<string, unknown> = {
    ...cacheJson,
    io: ioJson.io,
    phase: "all",
    requests: { cacheMs: cacheDiag.totalMs, ioMs: ioDiag.totalMs },
  };

  let httpCold: HttpTiming[] = [];
  let httpWarm: HttpTiming[] = [];
  let apiTiming: HttpTiming | undefined;

  if (!args.skipHttp) {
    // Flush again so HTML cold path sees empty Data Cache when possible.
    if (args.flushCache) {
      const flushUrl = new URL(`${args.baseUrl}/api/v1/admin/diagnostics/read-baseline`);
      flushUrl.searchParams.set("phase", "cache");
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
  const cacheBlock = diagnostics.cache as {
    cold?: { metrics?: { filesRead?: number } };
    warm?: { metrics?: { filesRead?: number } };
  } | undefined;

  const comparisons = {
    adminWarmTtfb: gapVsGoal(adminWarm?.ttfbMs ?? Number.POSITIVE_INFINITY, GOALS.adminWarmTtfbMs),
    adminWarmDocument: gapVsGoal(
      adminWarm?.documentBytes ?? Number.POSITIVE_INFINITY,
      GOALS.adminDocumentBytes,
    ),
    adminColdTtfb: gapVsGoal(
      adminCold?.ttfbMs ?? Number.POSITIVE_INFINITY,
      GOALS.adminColdAfterIndexMs,
    ),
    apiPage: gapVsGoal(
      apiTiming?.documentBytes ?? Number.POSITIVE_INFINITY,
      GOALS.apiProductsPageBytes,
    ),
    cacheWarmFilesRead: gapVsGoal(cacheBlock?.warm?.metrics?.filesRead ?? -1, 0, true),
    cacheColdFilesRead: {
      actual: cacheBlock?.cold?.metrics?.filesRead ?? null,
      note: "Esperado ≈ productCount no baseline pré-índice",
    },
  };

  // Warm cache filesRead: pass only if exactly 0
  comparisons.cacheWarmFilesRead = {
    goal: 0,
    actual: cacheBlock?.warm?.metrics?.filesRead ?? -1,
    pass: (cacheBlock?.warm?.metrics?.filesRead ?? -1) === 0,
    delta: (cacheBlock?.warm?.metrics?.filesRead ?? -1) - 0,
  };

  const report = {
    schemaVersion: 1,
    phase: 0,
    goals: GOALS,
    environment: {
      measuredAt: new Date().toISOString(),
      envLabel: args.envLabel,
      baseUrl: args.baseUrl,
      backend: diagnostics.backend,
      nodeEnv: diagnostics.nodeEnv,
      dataDir: diagnostics.dataDir,
      flushCache: args.flushCache,
    },
    diagnostics,
    http: {
      cold: httpCold,
      warm: httpWarm,
      api: apiTiming,
    },
    comparisons,
    callSitesBacklog: "docs/backlog-call-sites-catalogo-completo.md",
  };

  await fs.mkdir(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, "baseline-escalabilidade-leitura.json");
  const mdPath = path.join(args.outDir, "baseline-escalabilidade-leitura.md");
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, markdownReport(report), "utf8");

  console.log(`\nWrote ${path.relative(root, jsonPath)}`);
  console.log(`Wrote ${path.relative(root, mdPath)}`);
  console.log("\nSummary:");
  console.log(
    `  admin warm: TTFB ${adminWarm?.ttfbMs ?? "?"} ms, document ${adminWarm?.documentBytesHuman ?? "?"}`,
  );
  console.log(
    `  admin cold: TTFB ${adminCold?.ttfbMs ?? "?"} ms, document ${adminCold?.documentBytesHuman ?? "?"}`,
  );
  console.log(
    `  cache cold filesRead=${cacheBlock?.cold?.metrics?.filesRead ?? "?"} warm filesRead=${cacheBlock?.warm?.metrics?.filesRead ?? "?"}`,
  );
  console.log(`  api page: ${apiTiming?.documentBytesHuman ?? "?"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
