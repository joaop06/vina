import "server-only";
import path from "node:path";

/** `data-dev` em development; `data` em production (seed versionado). */
export const DATA_DIR_NAME =
  process.env.NODE_ENV === "development" ? "data-dev" : "data";

export const DATA_ROOT = path.join(process.cwd(), DATA_DIR_NAME);

export class InvalidPathError extends Error {
  code = "INVALID_PATH" as const;
  constructor(message = `Path fora de ${DATA_DIR_NAME}/`) {
    super(message);
    this.name = "InvalidPathError";
  }
}

/** Resolve path relativo a DATA_ROOT e bloqueia traversal. Retorna path absoluto. */
export function assertDataPath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("\0") ||
    normalized.split("/").some((p) => p === ".." || p === "")
  ) {
    throw new InvalidPathError();
  }
  if (path.isAbsolute(relativePath)) {
    throw new InvalidPathError();
  }
  const absolute = path.resolve(DATA_ROOT, normalized);
  const rootResolved = path.resolve(DATA_ROOT);
  if (
    absolute !== rootResolved &&
    !absolute.startsWith(rootResolved + path.sep)
  ) {
    throw new InvalidPathError();
  }
  return absolute;
}

/** Path relativo com barras `/` (sem prefixo data/). */
export function toPosixRelative(relativePath: string): string {
  assertDataPath(relativePath);
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function dataRepoPath(relativePath: string): string {
  return `data/${toPosixRelative(relativePath)}`;
}
