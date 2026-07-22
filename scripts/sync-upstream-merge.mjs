#!/usr/bin/env node
/**
 * Merge inteligente fork ← upstream (merge-base 3-vias).
 * Exit 0: commit pronto em main (sem conflitos).
 * Exit 1: conflitos — commit parcial em SYNC_CONFLICT_BRANCH (se definido).
 */
import { execFileSync } from "node:child_process";

const UPSTREAM_REF = process.env.UPSTREAM_REF ?? "upstream/main";
const SYNC_CONFLICT_BRANCH = process.env.SYNC_CONFLICT_BRANCH ?? "";
const COMMIT_MSG =
  process.env.SYNC_COMMIT_MESSAGE ??
  "chore(sync): atualizar base a partir do upstream";

function git(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: opts.stdio ?? ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function gitLines(args) {
  const out = git(args);
  return out ? out.split("\n").filter(Boolean) : [];
}

/** @returns {Map<string, string>} path -> status letter (M/A/D/R...) */
function diffNameStatus(from, to) {
  const lines = gitLines(["diff", "--name-status", from, to]);
  const map = new Map();
  for (const line of lines) {
    const tab = line.indexOf("\t");
    if (tab === -1) continue;
    const status = line.slice(0, tab);
    const rest = line.slice(tab + 1);
    const statusLetter = status.charAt(0);
    if (status.startsWith("R") || status.startsWith("C")) {
      const paths = rest.split("\t");
      const newPath = paths[1] ?? paths[0];
      map.set(newPath, statusLetter);
      if (paths[0] && paths[0] !== newPath) {
        map.set(paths[0], "D");
      }
    } else {
      map.set(rest, statusLetter);
    }
  }
  return map;
}

function assertCleanEnough() {
  try {
    git(["diff-index", "--quiet", "HEAD", "--"]);
  } catch {
    console.error(
      "Working tree com alterações não commitadas. Abortando sync.",
    );
    process.exit(2);
  }
}

function main() {
  assertCleanEnough();

  let mergeBase;
  try {
    mergeBase = git(["merge-base", "HEAD", UPSTREAM_REF]);
  } catch {
    console.error(`Não foi possível calcular merge-base com ${UPSTREAM_REF}`);
    process.exit(2);
  }

  if (mergeBase === git(["rev-parse", "HEAD"])) {
    const upstreamHead = git(["rev-parse", UPSTREAM_REF]);
    if (mergeBase === upstreamHead) {
      console.log("Já sincronizado com upstream.");
      process.exit(0);
    }
  }

  const forkChanges = diffNameStatus(mergeBase, "HEAD");
  const upstreamChanges = diffNameStatus(mergeBase, UPSTREAM_REF);

  const conflicts = [];
  for (const path of upstreamChanges.keys()) {
    if (forkChanges.has(path)) {
      conflicts.push(path);
    }
  }

  const upstreamOnly = [];
  for (const [path, status] of upstreamChanges) {
    if (!forkChanges.has(path)) {
      upstreamOnly.push({ path, status });
    }
  }

  if (conflicts.length > 0) {
    console.error("Conflitos (ambos os lados alteraram o mesmo arquivo):");
    for (const p of conflicts) console.error(`  - ${p}`);
    if (!SYNC_CONFLICT_BRANCH) {
      process.exit(1);
    }
    git(["checkout", "-b", SYNC_CONFLICT_BRANCH]);
  }

  for (const { path, status } of upstreamOnly) {
    if (status === "D") {
      try {
        git(["rm", "-f", "--", path]);
      } catch {
        /* já ausente */
      }
    } else {
      try {
        git(["checkout", UPSTREAM_REF, "--", path]);
      } catch (e) {
        console.error(`Falha ao trazer ${path} de ${UPSTREAM_REF}`);
        throw e;
      }
    }
  }

  let staged = false;
  try {
    git(["diff-index", "--quiet", "--cached", "HEAD", "--"]);
  } catch {
    staged = true;
  }
  let unstaged = false;
  try {
    git(["diff-index", "--quiet", "HEAD", "--"]);
  } catch {
    unstaged = true;
  }

  let message = COMMIT_MSG;
  if (conflicts.length > 0) {
    message += `\n\nArquivos com conflito (revisar manualmente após merge do PR):\n${conflicts.map((p) => `- ${p}`).join("\n")}`;
  }

  if (!staged && !unstaged) {
    if (conflicts.length > 0) {
      git(["commit", "--allow-empty", "-m", message]);
      process.exit(1);
    }
    console.log("Nenhuma alteração a aplicar após análise do merge-base.");
    process.exit(0);
  }

  git(["add", "-A"]);
  git(["commit", "-m", message]);

  if (conflicts.length > 0) {
    process.exit(1);
  }
  console.log("Sync aplicada com sucesso.");
  process.exit(0);
}

main();
