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
  siteConfigTabsToPersist,
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

  it("preserves meta.versao when compose falls back to defaults", () => {
    const fragments = splitSiteConfig(DEFAULT_SITE_CONFIG);
    fragments.meta = {
      versao: 42,
      atualizadoEm: "2026-07-28T12:00:00.000Z",
    };
    // Corrupt identidade so composeSiteConfigRaw fails siteConfigSchema.
    (fragments.identidade as { nomeLoja: string }).nomeLoja = "";
    const picked = pickSiteConfigSource({ legacy: null, fragments });
    assert.equal(picked.versao, 42);
    assert.equal(picked.atualizadoEm, "2026-07-28T12:00:00.000Z");
  });
});

describe("pickSiteConfigSource", () => {
  it("prefers fragments when both legacy and fragments exist", () => {
    const legacy = {
      ...DEFAULT_SITE_CONFIG,
      nomeLoja: "Loja do fork",
      versao: 7,
    };
    const fragments = splitSiteConfig({
      ...DEFAULT_SITE_CONFIG,
      nomeLoja: "Só fragmentos",
      versao: 3,
    });
    const picked = pickSiteConfigSource({ legacy, fragments });
    assert.equal(picked.nomeLoja, "Só fragmentos");
    assert.equal(picked.versao, 3);
  });

  it("uses fragments when legacy is absent", () => {
    const fragments = splitSiteConfig({
      ...DEFAULT_SITE_CONFIG,
      nomeLoja: "Só fragmentos",
    });
    const picked = pickSiteConfigSource({ legacy: null, fragments });
    assert.equal(picked.nomeLoja, "Só fragmentos");
  });

  it("uses legacy when fragments are absent", () => {
    const legacy = {
      ...DEFAULT_SITE_CONFIG,
      nomeLoja: "Só legado",
      versao: 4,
    };
    const picked = pickSiteConfigSource({ legacy, fragments: null });
    assert.equal(picked.nomeLoja, "Só legado");
    assert.equal(picked.versao, 4);
  });

  it("falls back to defaults when neither source exists", () => {
    const picked = pickSiteConfigSource({ legacy: null, fragments: null });
    assert.equal(picked.nomeLoja, DEFAULT_SITE_CONFIG.nomeLoja);
  });
});

describe("siteConfigTabsToPersist", () => {
  it("writes only touched tabs when storage is complete", () => {
    const tabs = siteConfigTabsToPersist(["identidade"], []);
    assert.deepEqual(tabs, ["identidade"]);
  });

  it("heals missing tabs alongside the patched tab without listing valid siblings", () => {
    const missing = SITE_CONFIG_TAB_IDS.filter((t) => t !== "identidade");
    const tabs = siteConfigTabsToPersist(["identidade"], missing);
    assert.ok(tabs.includes("identidade"));
    for (const t of missing) assert.ok(tabs.includes(t));
    assert.equal(tabs.length, SITE_CONFIG_TAB_IDS.length);
  });

  it("does not duplicate a tab that is both touched and fallback", () => {
    const tabs = siteConfigTabsToPersist(["whatsapp"], ["whatsapp", "tema"]);
    assert.deepEqual(tabs, ["whatsapp", "tema"]);
  });
});
