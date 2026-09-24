import { mediaUrl } from "@/src/foundation/behaviors/media/format";
import type { AtelieHeroConfig } from "@/src/schemas/atelie-hero";

export type AtelieHeroFrame =
  | { kind: "image"; src: string; alt: string; local: boolean }
  | { kind: "file"; src: string; alt: string }
  | { kind: "embed"; src: string; title: string };

function httpUrl(value: string): string | null {
  const url = value.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;
  return url;
}

function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      const fromQuery = parsed.searchParams.get("v");
      if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((part) => part === "embed" || part === "shorts");
      const id = marker >= 0 ? parts[marker + 1] : null;
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

function vimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const id = parsed.pathname.split("/").filter((part) => /^\d+$/.test(part)).pop();
    return id ?? null;
  } catch {
    return null;
  }
}

function isDirectVideo(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".mp4") || path.endsWith(".webm");
  } catch {
    return false;
  }
}

export function resolveAtelieHeroFrame(
  midia: AtelieHeroConfig["midia"],
  fallbackAlt: string,
): AtelieHeroFrame | null {
  if (midia.tipo === "nenhuma") return null;
  const alt = midia.alt.trim() || fallbackAlt;

  if (midia.origem === "upload") {
    const src = mediaUrl(midia.arquivo?.path);
    if (!src) return null;
    return midia.tipo === "video"
      ? { kind: "file", src, alt }
      : { kind: "image", src, alt, local: true };
  }

  const url = httpUrl(midia.url);
  if (!url) return null;

  if (midia.tipo === "foto") {
    return { kind: "image", src: url, alt, local: false };
  }

  const youtube = youtubeId(url);
  if (youtube) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: youtube,
      controls: "0",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    return {
      kind: "embed",
      src: `https://www.youtube-nocookie.com/embed/${youtube}?${params}`,
      title: alt,
    };
  }

  const vimeo = vimeoId(url);
  if (vimeo) {
    const params = new URLSearchParams({
      autoplay: "1",
      muted: "1",
      loop: "1",
      background: "1",
      autopause: "0",
    });
    return {
      kind: "embed",
      src: `https://player.vimeo.com/video/${vimeo}?${params}`,
      title: alt,
    };
  }

  if (isDirectVideo(url)) return { kind: "file", src: url, alt };
  return null;
}
