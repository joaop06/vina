import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./common";

export const bannerPosicaoSchema = z.enum(["hero", "faixa", "promo"]);

export type BannerPosicao = z.infer<typeof bannerPosicaoSchema>;

export const BANNER_POSICAO_LABELS: Record<BannerPosicao, string> = {
  hero: "Topo da loja",
  faixa: "Faixa intermediária",
  promo: "Promoção",
};

export const BANNER_POSICOES = bannerPosicaoSchema.options;

export const bannerImageSchema = z.object({
  id: uuidSchema,
  path: z.string().min(1),
  alt: z.string().optional(),
});

export const bannerImageInputSchema = z
  .object({
    id: uuidSchema,
    path: z.string(),
    alt: z.string().optional(),
    pending: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.pending && !val.path.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "path obrigatório quando a imagem não está pendente",
        path: ["path"],
      });
    }
  });

/** Relative storefront path (`/catalogo`) or absolute http(s) URL. */
export const bannerHrefSchema = z
  .union([z.string().max(500), z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return undefined;
    const t = v.trim();
    return t ? t : undefined;
  })
  .refine(
    (val) =>
      val === undefined ||
      val.startsWith("/") ||
      val.startsWith("http://") ||
      val.startsWith("https://"),
    { message: "Use um caminho começando com / ou uma URL http(s)" },
  );

export const bannerSchema = z.object({
  id: uuidSchema,
  versao: z.number().int().min(1),
  posicao: bannerPosicaoSchema,
  ordem: z.number().int(),
  ativo: z.boolean(),
  imagem: bannerImageSchema,
  href: z.string().max(500).optional(),
  criadoEm: isoDateSchema,
  atualizadoEm: isoDateSchema,
});

export const bannerCreateSchema = z.object({
  posicao: bannerPosicaoSchema,
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
  href: bannerHrefSchema,
  imagem: bannerImageInputSchema,
});

export const bannerUpdateSchema = bannerCreateSchema
  .partial()
  .extend({ versao: z.number().int().min(1) });

export type Banner = z.infer<typeof bannerSchema>;
