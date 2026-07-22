import { z } from "zod";
import { isoDateSchema, slugSchema, uuidSchema } from "./common";

export const productImageSchema = z.object({
  id: uuidSchema,
  path: z.string().min(1),
  alt: z.string().optional(),
  ordem: z.number().int().min(0),
});

/** Input may mark images as pending (file attached in multipart). */
export const productImageInputSchema = z
  .object({
    id: uuidSchema,
    path: z.string(),
    alt: z.string().optional(),
    ordem: z.number().int().min(0),
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

export const productVariantSchema = z.object({
  id: uuidSchema,
  tamanho: z.string().min(1).max(40),
  cor: z.string().min(1).max(60),
  estoque: z.number().int().min(0),
  /** Override de preço da variante; null/omitido = herda preço global do produto. */
  preco: z.number().min(0).nullable().optional(),
  sku: z.string().max(80).optional(),
});

export const productStatusSchema = z.enum(["ativo", "oculto", "esgotado"]);

export const productSchema = z.object({
  id: uuidSchema,
  versao: z.number().int().min(1),
  nome: z.string().min(1).max(120),
  slug: slugSchema,
  descricao: z.string().max(5000).default(""),
  /** Código auxiliar interno; único quando preenchido. */
  referencia: z.string().max(80).default(""),
  preco: z.number().min(0),
  precoPromocional: z.number().min(0).nullable(),
  categoriasIds: z.array(uuidSchema).min(1),
  status: productStatusSchema,
  destaque: z.boolean(),
  lancamento: z.boolean(),
  imagens: z.array(productImageSchema).max(12),
  variantes: z.array(productVariantSchema),
  criadoEm: isoDateSchema,
  atualizadoEm: isoDateSchema,
});

export const productCreateSchema = z.object({
  nome: z.string().min(1).max(120),
  slug: slugSchema.optional(),
  descricao: z.string().max(5000).optional(),
  referencia: z.string().max(80).optional(),
  preco: z.number().min(0),
  precoPromocional: z.number().min(0).nullable().optional(),
  categoriasIds: z.array(uuidSchema).min(1),
  status: productStatusSchema.optional(),
  destaque: z.boolean().optional(),
  lancamento: z.boolean().optional(),
  imagens: z.array(productImageInputSchema).max(12).optional(),
  variantes: z.array(productVariantSchema).optional(),
});

export const productUpdateSchema = productCreateSchema
  .partial()
  .extend({ versao: z.number().int().min(1) })
  .superRefine((val, ctx) => {
    if (val.categoriasIds !== undefined && val.categoriasIds.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione pelo menos uma categoria",
        path: ["categoriasIds"],
      });
    }
  });

export const productStatusUpdateSchema = z.object({
  status: productStatusSchema,
  versao: z.number().int().min(1),
});

export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
