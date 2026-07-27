import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SITE_CONFIG } from "@/src/config/default-site-config";
import { siteConfigSchema } from "@/src/schemas/site-config";
import {
  SITE_CONFIG_TAB_IDS,
  composeSiteConfigRaw,
  extractTabSlice,
  mergeTabIntoConfig,
  pickSiteConfigSource,
  splitSiteConfig,
} from "@/src/schemas/site-config-tabs";

function stripVolatile(config: ReturnType<typeof siteConfigSchema.parse>) {
  const copy = { ...config };
  delete (copy as { atualizadoEm?: string }).atualizadoEm;
  return copy;
}

describe("site-config-tabs compose/split", () => {
  it("round-trips DEFAULT_SITE_CONFIG", () => {
    const split = splitSiteConfig(DEFAULT_SITE_CONFIG);
    const again = siteConfigSchema.parse(composeSiteConfigRaw(split));
    assert.deepEqual(stripVolatile(again), stripVolatile(DEFAULT_SITE_CONFIG));
  });

  it("extract + merge preserves each tab slice", () => {
    let config = DEFAULT_SITE_CONFIG;
    for (const tab of SITE_CONFIG_TAB_IDS) {
      const slice = extractTabSlice(config, tab);
      config = mergeTabIntoConfig(config, tab, slice);
    }
    assert.deepEqual(
      stripVolatile(siteConfigSchema.parse(config)),
      stripVolatile(DEFAULT_SITE_CONFIG),
    );
  });

  it("mergeTabIntoConfig updates versao from meta", () => {
    const next = mergeTabIntoConfig(
      DEFAULT_SITE_CONFIG,
      "painel",
      { painel: { metaReceitaMensal: 1000 } },
      { versao: 9, atualizadoEm: "2026-07-01T00:00:00.000Z" },
    );
    assert.equal(next.versao, 9);
    assert.equal(next.painel.metaReceitaMensal, 1000);
  });
});

describe("pickSiteConfigSource", () => {
  it("prefers legacy site.json when fragments also exist", () => {
    const legacy = {
      ...DEFAULT_SITE_CONFIG,
      nomeLoja: "Loja do fork",
      versao: 7,
    };
    const fragments = splitSiteConfig(DEFAULT_SITE_CONFIG);
    const picked = pickSiteConfigSource({ legacy, fragments });
    assert.equal(picked.nomeLoja, "Loja do fork");
    assert.equal(picked.versao, 7);
  });

  it("uses fragments when legacy is absent", () => {
    const fragments = splitSiteConfig({
      ...DEFAULT_SITE_CONFIG,
      nomeLoja: "Só fragmentos",
    });
    const picked = pickSiteConfigSource({ legacy: null, fragments });
    assert.equal(picked.nomeLoja, "Só fragmentos");
  });

  it("falls back to defaults when neither source exists", () => {
    const picked = pickSiteConfigSource({ legacy: null, fragments: null });
    assert.equal(picked.nomeLoja, DEFAULT_SITE_CONFIG.nomeLoja);
  });
});
