import type { SiteConfig, SiteLayoutId } from "@/src/schemas/site-config";

const HEX6 = /^#[0-9A-Fa-f]{6}$/;
const HEX3 = /^#[0-9A-Fa-f]{3}$/;

export function normalizeHexForPicker(value: string): string {
  const v = value.trim();
  if (HEX6.test(v)) return v.toLowerCase();
  if (HEX3.test(v)) {
    const [, a, b, c] = v;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return "#ed1c24";
}

export function expandHexIfComplete(raw: string): string | null {
  const v = raw.trim();
  if (HEX6.test(v)) return v.toUpperCase();
  if (HEX3.test(v)) {
    const [, a, b, c] = v;
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }
  return null;
}

/** Keep document theme in sync with configurações without a full page reload. */
export function applySiteTheme(config: Pick<SiteConfig, "cores" | "layout">) {
  const { cores, layout } = config;
  const root = document.documentElement;
  root.style.setProperty("--pq-red", cores.primaria);
  root.style.setProperty("--pq-black", cores.secundaria);
  root.style.setProperty("--pq-white", cores.fundo);
  root.style.setProperty("--pq-gray-50", cores.fundoNeutro);
  root.style.setProperty("--pq-gray-border", cores.borda);
  const thumbByLayout: Record<string, [string, string]> = {
    classic: [
      `color-mix(in srgb, ${cores.primaria} 45%, transparent)`,
      `color-mix(in srgb, ${cores.primaria} 70%, transparent)`,
    ],
    split: [
      `color-mix(in srgb, ${cores.primaria} 40%, transparent)`,
      cores.primaria,
    ],
    gallery: [
      `color-mix(in srgb, ${cores.primaria} 28%, transparent)`,
      `color-mix(in srgb, ${cores.primaria} 50%, transparent)`,
    ],
  };
  const [thumb, thumbHover] =
    thumbByLayout[layout ?? "classic"] ?? thumbByLayout.classic!;
  root.style.setProperty("--pq-scrollbar-thumb", thumb);
  root.style.setProperty("--pq-scrollbar-thumb-hover", thumbHover);
  if (layout) {
    root.dataset.layout = layout;
    document.body.dataset.layout = layout;
  }
}

export function LayoutPreview({
  id,
  primaryColor,
}: {
  id: SiteLayoutId;
  primaryColor: string;
}) {
  if (id === "split") {
    return (
      <svg viewBox="0 0 160 88" aria-hidden="true">
        <rect width="160" height="10" fill="#111" />
        <rect y="10" width="160" height="14" fill={primaryColor} />
        <rect y="24" width="80" height="64" fill={primaryColor} />
        <rect x="80" y="24" width="80" height="64" fill="#111" />
        <circle cx="120" cy="56" r="16" fill="#555" opacity="0.5" />
      </svg>
    );
  }

  if (id === "gallery") {
    return (
      <svg viewBox="0 0 160 88" aria-hidden="true">
        <rect width="160" height="10" fill="#f5f5f5" />
        <rect y="10" width="160" height="12" fill="#fff" stroke="#ddd" />
        <rect y="22" width="160" height="48" fill="#222" />
        <rect x="14" y="48" width="52" height="7" fill="#fff" opacity="0.92" />
        <rect x="14" y="58" width="34" height="4" fill="#fff" opacity="0.5" />
        <circle cx="70" cy="64" r="2" fill="#fff" />
        <circle cx="78" cy="64" r="2" fill="#fff" opacity="0.45" />
        <circle cx="86" cy="64" r="2" fill="#fff" opacity="0.45" />
        <rect y="70" width="50" height="18" fill="#eee" />
        <rect x="55" y="70" width="50" height="18" fill="#f5f5f5" />
        <rect x="110" y="70" width="50" height="18" fill="#eee" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 88" aria-hidden="true">
      <rect width="160" height="10" fill="#111" />
      <rect y="10" width="160" height="14" fill={primaryColor} />
      <defs>
        <linearGradient id="classicHero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
      </defs>
      <rect y="24" width="160" height="44" fill="url(#classicHero)" />
      <rect x="18" y="38" width="56" height="8" fill="#fff" opacity="0.9" />
      <rect x="18" y="50" width="36" height="5" fill="#fff" opacity="0.55" />
      <rect y="68" width="50" height="20" fill="#eee" />
      <rect x="55" y="68" width="50" height="20" fill="#f5f5f5" />
      <rect x="110" y="68" width="50" height="20" fill="#eee" />
    </svg>
  );
}
