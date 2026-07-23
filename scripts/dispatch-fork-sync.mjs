#!/usr/bin/env node
/**
 * Dispara repository_dispatch (upstream-sync) em cada fork do repositório atual.
 * Requer GH_TOKEN com permissão de escrita (repo) em cada fork alvo.
 */
const token = process.env.GH_TOKEN?.trim();
const repository = process.env.GITHUB_REPOSITORY?.trim();

if (!token) {
  console.error("GH_TOKEN ausente.");
  process.exit(1);
}
if (!repository?.includes("/")) {
  console.error("GITHUB_REPOSITORY inválido.");
  process.exit(1);
}

const [owner, repo] = repository.split("/");
const eventType = process.env.SYNC_DISPATCH_EVENT ?? "upstream-sync";
const apiBase = "https://api.github.com";

async function gh(path, opts = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${opts.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function listForks() {
  const forks = [];
  let page = 1;
  for (;;) {
    const batch = await gh(
      `/repos/${owner}/${repo}/forks?per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    forks.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return forks;
}

async function dispatchSync(forkFullName) {
  const payload = {
    event_type: eventType,
    client_payload: {
      upstream: repository,
      upstream_sha: process.env.GITHUB_SHA ?? "",
    },
  };
  await gh(`/repos/${forkFullName}/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function main() {
  const forks = await listForks();
  if (forks.length === 0) {
    console.log("Nenhum fork encontrado.");
    return;
  }

  console.log(`Encontrados ${forks.length} fork(s). Disparando sync…`);
  let ok = 0;
  let failed = 0;

  for (const fork of forks) {
    const name = fork.full_name;
    try {
      await dispatchSync(name);
      console.log(`  ✓ ${name}`);
      ok += 1;
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
      failed += 1;
    }
  }

  console.log(`Concluído: ${ok} ok, ${failed} falha(s).`);
  if (failed > 0 && ok === 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
