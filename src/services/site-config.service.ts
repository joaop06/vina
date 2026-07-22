import "server-only";
import { cache } from "react";
import { commitFiles, readBinary, readJson } from "@/src/lib/data";
import { buildMutationFiles } from "@/src/lib/data/commit-mutation";
import { AppError } from "@/src/lib/api/errors";
import { CACHE_TAGS } from "@/src/lib/cache-tags";
import { revalidateStorefront } from "@/src/lib/admin/revalidate-storefront";
import { syncEnderecoTexto } from "@/src/lib/br/endereco";
import { normalizeWaDigits } from "@/src/lib/wa";
import { DEFAULT_SITE_CONFIG } from "@/src/config/default-site-config";
import {
  siteConfigSchema,
  siteLogoSchema,
  type SiteConfig,
  type SiteLogo,
  type siteConfigUpdateSchema,
  type siteLogoInputSchema,
} from "@/src/schemas/site-config";
import { DEFAULT_NAVEGACAO, siteNavegacaoSchema } from "@/src/schemas/navigation";
import {
  prepareImageBinary,
  type PendingBinary,
} from "@/src/services/upload.service";
import type { z } from "zod";

const PATH = "configuracoes/site.json";

export { DEFAULT_SITE_CONFIG };

type LogoInput = z.infer<typeof siteLogoInputSchema>;

async function resolveLogo(
  logo: LogoInput,
  pendingBinaries: Map<string, PendingBinary>,
  fallbackAlt: string,
): Promise<{
  logo: SiteLogo;
  binaryWrites: { path: string; bytes: Buffer }[];
}> {
  const pending = pendingBinaries.get(logo.id);
  if (pending || logo.pending) {
    if (!pending) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Arquivo pendente não enviado para a logo",
        400,
      );
    }
    const prepared = prepareImageBinary(pending, "site", logo.id);
    return {
      logo: siteLogoSchema.parse({
        id: prepared.id,
        path: prepared.path,
        alt: logo.alt?.trim() || fallbackAlt,
      }),
      binaryWrites: [{ path: prepared.path, bytes: prepared.bytes }],
    };
  }

  const bytes = await readBinary(logo.path);
  if (!bytes) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Logo não encontrada. Selecione o arquivo novamente.",
      400,
    );
  }
  return {
    logo: siteLogoSchema.parse({
      id: logo.id,
      path: logo.path,
      alt: logo.alt?.trim() || fallbackAlt,
    }),
    binaryWrites: [],
  };
}

function applyWhatsappTemplateMigrations(config: SiteConfig): SiteConfig {
  const parsed = siteConfigSchema.safeParse(config);
  if (!parsed.success) return config;
  return parsed.data;
}

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const raw = await readJson<unknown>(PATH);
  if (!raw) return DEFAULT_SITE_CONFIG;
  const parsed = siteConfigSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[site-config] invalid, using defaults", parsed.error.flatten());
    return DEFAULT_SITE_CONFIG;
  }
  return applyWhatsappTemplateMigrations(parsed.data);
});

export async function updateSiteConfig(
  input: z.infer<typeof siteConfigUpdateSchema>,
  pendingBinaries: Map<string, PendingBinary> = new Map(),
): Promise<SiteConfig> {
  const current = await getSiteConfig();
  if (current.versao !== input.versao) {
    throw new AppError(
      "VERSION_CONFLICT",
      "Versão desatualizada. Recarregue e tente novamente.",
      409,
    );
  }
  const { versao: _ignoredVersao, logo: inputLogo, ...rest } = input;
  void _ignoredVersao;

  let logo = current.logo ?? null;
  let binaryWrites: { path: string; bytes: Buffer }[] = [];
  const deletes: string[] = [];

  if (inputLogo === null) {
    if (current.logo?.path) deletes.push(current.logo.path);
    logo = null;
  } else if (inputLogo) {
    const fallbackAlt = rest.nomeLoja?.trim() || current.nomeLoja;
    const resolved = await resolveLogo(inputLogo, pendingBinaries, fallbackAlt);
    logo = resolved.logo;
    binaryWrites = resolved.binaryWrites;
    if (current.logo?.path && current.logo.path !== logo.path) {
      deletes.push(current.logo.path);
    }
  }

  const updated: SiteConfig = {
    ...current,
    ...rest,
    cores: { ...current.cores, ...(rest.cores ?? {}) },
    whatsapp: { ...current.whatsapp, ...(rest.whatsapp ?? {}) },
    instagram: { ...current.instagram, ...(rest.instagram ?? {}) },
    endereco: syncEnderecoTexto({
      ...current.endereco,
      ...(rest.endereco ?? {}),
    }),
    telefones: { ...current.telefones, ...(rest.telefones ?? {}) },
    textos: { ...current.textos, ...(rest.textos ?? {}) },
    navegacao: rest.navegacao
      ? siteNavegacaoSchema.parse(rest.navegacao)
      : (current.navegacao ?? DEFAULT_NAVEGACAO),
    painel: { ...(current.painel ?? { metaReceitaMensal: null }), ...(rest.painel ?? {}) },
    logo,
    versao: current.versao + 1,
    atualizadoEm: new Date().toISOString(),
  };
  updated.whatsapp.telefone = normalizeWaDigits(updated.whatsapp.telefone);
  updated.telefones.fixo = normalizeWaDigits(updated.telefones.fixo);
  updated.telefones.celular = normalizeWaDigits(updated.telefones.celular);
  const validated = siteConfigSchema.parse(updated);

  await commitFiles(
    buildMutationFiles({
      binaryWrites,
      jsonWrites: [{ path: PATH, data: validated }],
      deletes,
    }),
    "chore(data): update site config",
  );
  revalidateStorefront(
    CACHE_TAGS.siteConfig,
    CACHE_TAGS.media,
    CACHE_TAGS.dashboard,
  );
  return validated;
}
