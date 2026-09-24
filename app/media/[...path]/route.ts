import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { readBinary } from "@/src/foundation/data";
import { CACHE_TAGS } from "@/src/foundation/cache/cache-tags";
import path from "node:path";

type Ctx = { params: Promise<{ path: string[] }> };

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const REVALIDATE_SECONDS = 3600;

/** Next Data Cache rejects entries over 2MB; base64 is ~4/3 of raw size. */
const MAX_RAW_FOR_DATA_CACHE = 1_400_000;

type CachedMedia =
  | { kind: "data"; base64: string }
  | { kind: "large" };

class MediaNotFoundError extends Error {
  constructor(relative: string) {
    super(`Media not found: ${relative}`);
    this.name = "MediaNotFoundError";
  }
}

/**
 * Cache hits only — throws on miss so 404s are not stored in the Data Cache.
 * Oversized files cache a tiny marker; the handler re-reads them (HTTP Cache-Control still applies).
 */
function getCachedMediaEntry(relative: string) {
  return unstable_cache(
    async (): Promise<CachedMedia> => {
      const bytes = await readBinary(relative);
      if (!bytes) throw new MediaNotFoundError(relative);
      if (bytes.length > MAX_RAW_FOR_DATA_CACHE) {
        return { kind: "large" };
      }
      return { kind: "data", base64: bytes.toString("base64") };
    },
    // v3: structured entries so >2MB files no longer blow the Data Cache
    [`media-v3-${relative}`],
    { tags: [CACHE_TAGS.media], revalidate: REVALIDATE_SECONDS },
  )();
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const parts = (await ctx.params).path;
  if (!parts?.length) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }
  const relative =
    parts[0] === "videos" ? parts.join("/") : ["imagens", ...parts].join("/");
  let entry: CachedMedia;
  try {
    entry = await getCachedMediaEntry(relative);
  } catch (e) {
    const isMiss =
      e instanceof MediaNotFoundError ||
      (e instanceof Error && e.name === "MediaNotFoundError");
    if (isMiss) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Not found" } },
        { status: 404 },
      );
    }
    throw e;
  }

  let body: Uint8Array;
  if (entry.kind === "large") {
    const bytes = await readBinary(relative);
    if (!bytes) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Not found" } },
        { status: 404 },
      );
    }
    body = new Uint8Array(bytes);
  } else {
    body = new Uint8Array(Buffer.from(entry.base64, "base64"));
  }

  const ext = path.extname(relative).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  const range = _req.headers.get("range");
  if (range && (ext === ".mp4" || ext === ".webm")) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range.trim());
    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : body.length - 1;
      if (start <= end && end < body.length) {
        const chunk = body.subarray(start, end + 1);
        return new NextResponse(chunk as BodyInit, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${end}/${body.length}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk.length),
            "Cache-Control":
              "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      }
    }
  }

  return new NextResponse(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
