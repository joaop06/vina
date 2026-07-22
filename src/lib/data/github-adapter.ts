import "server-only";
import { Octokit } from "@octokit/rest";
import { getGithubConfig } from "@/src/lib/env";
import { recordReadOp } from "@/src/lib/observability/read-metrics";
import { dataRepoPath, toPosixRelative } from "./paths";
import type { DataAdapter, DeleteOpts, FileChange, WriteOpts } from "./types";

let octokitClient: Octokit | null = null;

function octokit() {
  if (!octokitClient) {
    const { token } = getGithubConfig();
    octokitClient = new Octokit({ auth: token });
  }
  return octokitClient;
}

function githubRepo() {
  const { owner, repo, branch } = getGithubConfig();
  return { owner, repo, branch };
}

function serializeJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

async function getContent(relativePath: string) {
  const { owner, repo, branch } = githubRepo();
  const path = dataRepoPath(relativePath);
  try {
    const { data } = await octokit().repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (Array.isArray(data) || data.type !== "file") return null;
    return data;
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) return null;
    throw e;
  }
}

function decodeContent(data: {
  content?: string | null;
  encoding?: string;
}): Buffer | null {
  if (!data.content) return null;
  if (data.encoding === "base64") {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64");
  }
  return Buffer.from(data.content, "utf8");
}

/**
 * Contents API omits inline `content` for files larger than ~1 MiB.
 * Fall back to the Git Blobs API (supports up to 100 MiB).
 */
async function readBlobBySha(sha: string): Promise<Buffer | null> {
  const { owner, repo } = githubRepo();
  try {
    const { data } = await octokit().git.getBlob({
      owner,
      repo,
      file_sha: sha,
    });
    if (!data.content) return null;
    if (data.encoding === "base64") {
      return Buffer.from(data.content.replace(/\n/g, ""), "base64");
    }
    return Buffer.from(data.content, "utf8");
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 404) return null;
    throw e;
  }
}

async function resolveFileBytes(file: {
  content?: string | null;
  encoding?: string;
  sha: string;
}): Promise<Buffer | null> {
  const inline = decodeContent(file);
  if (inline) return inline;
  return readBlobBySha(file.sha);
}

export const githubAdapter: DataAdapter = {
  async getFileSha(relativePath) {
    const file = await getContent(relativePath);
    return file?.sha ?? null;
  },

  async readJson<T>(relativePath: string): Promise<T | null> {
    const t0 = performance.now();
    try {
      const file = await getContent(relativePath);
      if (!file) {
        recordReadOp({
          kind: "readJson",
          path: relativePath,
          bytes: 0,
          durationMs: performance.now() - t0,
          ok: false,
        });
        return null;
      }
      const buf = await resolveFileBytes(file);
      if (!buf) {
        recordReadOp({
          kind: "readJson",
          path: relativePath,
          bytes: 0,
          durationMs: performance.now() - t0,
          ok: false,
        });
        return null;
      }
      recordReadOp({
        kind: "readJson",
        path: relativePath,
        bytes: buf.byteLength,
        durationMs: performance.now() - t0,
        ok: true,
      });
      return JSON.parse(buf.toString("utf8")) as T;
    } catch (e) {
      recordReadOp({
        kind: "readJson",
        path: relativePath,
        bytes: 0,
        durationMs: performance.now() - t0,
        ok: false,
      });
      throw e;
    }
  },

  async listJsonDir(relativeDir: string): Promise<string[]> {
    const { owner, repo, branch } = githubRepo();
    const path = dataRepoPath(relativeDir);
    const t0 = performance.now();
    try {
      const { data } = await octokit().repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      if (!Array.isArray(data)) {
        recordReadOp({
          kind: "listJsonDir",
          path: relativeDir,
          bytes: 0,
          durationMs: performance.now() - t0,
          ok: true,
        });
        return [];
      }
      const names = data
        .filter((e) => e.type === "file" && e.name.endsWith(".json"))
        .map((e) => e.name)
        .sort();
      recordReadOp({
        kind: "listJsonDir",
        path: relativeDir,
        bytes: names.reduce((sum, n) => sum + Buffer.byteLength(n, "utf8"), 0),
        durationMs: performance.now() - t0,
        ok: true,
      });
      return names;
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) {
        recordReadOp({
          kind: "listJsonDir",
          path: relativeDir,
          bytes: 0,
          durationMs: performance.now() - t0,
          ok: true,
        });
        return [];
      }
      recordReadOp({
        kind: "listJsonDir",
        path: relativeDir,
        bytes: 0,
        durationMs: performance.now() - t0,
        ok: false,
      });
      throw e;
    }
  },

  async writeJson(relativePath, data, opts?: WriteOpts) {
    await this.commitFiles(
      [
        {
          path: dataRepoPath(relativePath),
          content: serializeJson(data),
          encoding: "utf-8",
        },
      ],
      opts?.message ?? `chore(data): update ${toPosixRelative(relativePath)}`,
    );
  },

  async deleteJson(relativePath, opts?: DeleteOpts) {
    await this.commitFiles(
      [{ path: dataRepoPath(relativePath), delete: true }],
      opts?.message ?? `chore(data): delete ${toPosixRelative(relativePath)}`,
    );
  },

  async readBinary(relativePath) {
    const t0 = performance.now();
    try {
      const file = await getContent(relativePath);
      if (!file) {
        recordReadOp({
          kind: "readBinary",
          path: relativePath,
          bytes: 0,
          durationMs: performance.now() - t0,
          ok: false,
        });
        return null;
      }
      const buf = await resolveFileBytes(file);
      recordReadOp({
        kind: "readBinary",
        path: relativePath,
        bytes: buf?.byteLength ?? 0,
        durationMs: performance.now() - t0,
        ok: Boolean(buf),
      });
      return buf;
    } catch (e) {
      recordReadOp({
        kind: "readBinary",
        path: relativePath,
        bytes: 0,
        durationMs: performance.now() - t0,
        ok: false,
      });
      throw e;
    }
  },

  async writeBinary(relativePath, bytes, opts?: WriteOpts) {
    await this.commitFiles(
      [
        {
          path: dataRepoPath(relativePath),
          content: bytes,
        },
      ],
      opts?.message ?? `chore(data): upload ${toPosixRelative(relativePath)}`,
    );
  },

  async commitFiles(files: FileChange[], message: string) {
    const { owner, repo, branch } = githubRepo();
    const api = octokit();

    const { data: refData } = await api.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = refData.object.sha;

    const { data: commitData } = await api.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    const treeItems: {
      path: string;
      mode: "100644";
      type: "blob";
      sha?: string | null;
      content?: string;
    }[] = [];

    for (const file of files) {
      const repoPath = file.path.startsWith("data/")
        ? file.path
        : dataRepoPath(file.path);

      if ("delete" in file && file.delete) {
        treeItems.push({
          path: repoPath,
          mode: "100644",
          type: "blob",
          sha: null,
        });
        continue;
      }

      const writeFile = file as Exclude<FileChange, { delete: true }>;
      let content: string;
      if (Buffer.isBuffer(writeFile.content)) {
        content = writeFile.content.toString("base64");
        const { data: blob } = await api.git.createBlob({
          owner,
          repo,
          content,
          encoding: "base64",
        });
        treeItems.push({
          path: repoPath,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
      } else if (writeFile.encoding === "base64") {
        const { data: blob } = await api.git.createBlob({
          owner,
          repo,
          content: writeFile.content,
          encoding: "base64",
        });
        treeItems.push({
          path: repoPath,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
      } else {
        treeItems.push({
          path: repoPath,
          mode: "100644",
          type: "blob",
          content: writeFile.content,
        });
      }
    }

    const { data: newTree } = await api.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeItems,
    });

    const { data: newCommit } = await api.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    try {
      await api.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });
    } catch (e) {
      const err = e as Error & { code?: string; status?: number };
      err.code = "VERSION_CONFLICT";
      throw err;
    }
  },
};
