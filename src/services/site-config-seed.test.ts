import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { siteConfigSchema } from "@/src/schemas/site-config";
import { DEFAULT_SITE_CONFIG } from "@/src/config/default-site-config";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const siteJsonPath = path.join(repoRoot, "data/configuracoes/site.json");

function stripVolatile(config: ReturnType<typeof siteConfigSchema.parse>) {
  const copy = { ...config };
  delete (copy as { atualizadoEm?: string }).atualizadoEm;
  return copy;
}

describe("seed site.json vs DEFAULT_SITE_CONFIG", () => {
  it("parses site.json with siteConfigSchema", () => {
    const raw = JSON.parse(readFileSync(siteJsonPath, "utf8")) as unknown;
    const parsed = siteConfigSchema.parse(raw);
    assert.equal(parsed.versao, 1);
    assert.ok(parsed.nomeLoja.length >= 1);
  });

  it("matches DEFAULT_SITE_CONFIG except atualizadoEm", () => {
    const raw = JSON.parse(readFileSync(siteJsonPath, "utf8")) as unknown;
    const fromFile = siteConfigSchema.parse(raw);
    const fromDefault = siteConfigSchema.parse({
      ...DEFAULT_SITE_CONFIG,
      atualizadoEm: fromFile.atualizadoEm,
    });
    assert.deepEqual(stripVolatile(fromFile), stripVolatile(fromDefault));
  });
});
