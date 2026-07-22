import type { z } from "zod";
import {
  buildCompactCartItemTemplate,
  DEFAULT_COMPACT_CART_ITEM_PARTS,
  parseCompactCartItemTemplate,
} from "@/src/lib/wa-compact-template";
import {
  buildCartWaTemplate,
  DEFAULT_CART_WA_TEMPLATE_PARTS,
  migrateLegacyMensagemCarrinho,
  parseCartWaTemplate,
} from "@/src/lib/wa-cart-template";
import {
  buildProductWaTemplate,
  DEFAULT_PRODUCT_WA_TEMPLATE_PARTS,
  migrateLegacyMensagemProduto,
  parseProductWaTemplate,
} from "@/src/lib/wa-product-template";
import {
  cartWaTemplatePartsSchema,
  compactCartItemPartsSchema,
  productWaTemplatePartsSchema,
} from "@/src/lib/wa-template-validation";

type WhatsappRaw = {
  mensagemProdutoParts?: z.infer<typeof productWaTemplatePartsSchema>;
  mensagemCarrinhoParts?: z.infer<typeof cartWaTemplatePartsSchema>;
  mensagemCarrinhoItemCompactoParts?: z.infer<
    typeof compactCartItemPartsSchema
  >;
  mensagemProdutoItemCompactoParts?: z.infer<
    typeof compactCartItemPartsSchema
  >;
  mensagemProduto?: string;
  mensagemCarrinho?: string;
  mensagemCarrinhoItemCompacto?: string;
  [key: string]: unknown;
};

export function normalizeWhatsappTemplates<T extends WhatsappRaw>(
  whatsapp: T,
): T & {
  mensagemProdutoParts: z.infer<typeof productWaTemplatePartsSchema>;
  mensagemCarrinhoParts: z.infer<typeof cartWaTemplatePartsSchema>;
  mensagemCarrinhoItemCompactoParts: z.infer<
    typeof compactCartItemPartsSchema
  >;
  mensagemProdutoItemCompactoParts: z.infer<
    typeof compactCartItemPartsSchema
  >;
} {
  let mensagemProdutoParts = whatsapp.mensagemProdutoParts;
  if (!mensagemProdutoParts) {
    let legacy = whatsapp.mensagemProduto?.trim();
    if (legacy) {
      const migrated = migrateLegacyMensagemProduto(legacy);
      if (migrated) legacy = migrated;
    }
    mensagemProdutoParts =
      (legacy ? parseProductWaTemplate(legacy) : null) ??
      DEFAULT_PRODUCT_WA_TEMPLATE_PARTS;
  }
  mensagemProdutoParts =
    productWaTemplatePartsSchema.parse(mensagemProdutoParts);

  let mensagemCarrinhoParts = whatsapp.mensagemCarrinhoParts;
  if (!mensagemCarrinhoParts) {
    let legacy = whatsapp.mensagemCarrinho?.trim();
    if (legacy) {
      const migrated = migrateLegacyMensagemCarrinho(legacy);
      if (migrated) legacy = migrated;
    }
    mensagemCarrinhoParts = legacy
      ? parseCartWaTemplate(legacy)
      : DEFAULT_CART_WA_TEMPLATE_PARTS;
  }
  mensagemCarrinhoParts = cartWaTemplatePartsSchema.parse(mensagemCarrinhoParts);

  let mensagemCarrinhoItemCompactoParts =
    whatsapp.mensagemCarrinhoItemCompactoParts;
  if (!mensagemCarrinhoItemCompactoParts) {
    const legacy = whatsapp.mensagemCarrinhoItemCompacto?.trim();
    mensagemCarrinhoItemCompactoParts = legacy
      ? parseCompactCartItemTemplate(legacy)
      : DEFAULT_COMPACT_CART_ITEM_PARTS;
  }
  mensagemCarrinhoItemCompactoParts = compactCartItemPartsSchema.parse(
    mensagemCarrinhoItemCompactoParts,
  );

  let mensagemProdutoItemCompactoParts =
    whatsapp.mensagemProdutoItemCompactoParts;
  if (!mensagemProdutoItemCompactoParts) {
    mensagemProdutoItemCompactoParts = { ...DEFAULT_COMPACT_CART_ITEM_PARTS };
  }
  mensagemProdutoItemCompactoParts = compactCartItemPartsSchema.parse(
    mensagemProdutoItemCompactoParts,
  );

  const {
    mensagemProduto: _mp,
    mensagemCarrinho: _mc,
    mensagemCarrinhoItemCompacto: _mci,
    mostrarCarrinho: _legacyMostrarCarrinho,
    ...rest
  } = whatsapp;

  return {
    ...rest,
    mensagemProdutoParts,
    mensagemCarrinhoParts,
    mensagemCarrinhoItemCompactoParts,
    mensagemProdutoItemCompactoParts,
  } as T & {
    mensagemProdutoParts: z.infer<typeof productWaTemplatePartsSchema>;
    mensagemCarrinhoParts: z.infer<typeof cartWaTemplatePartsSchema>;
    mensagemCarrinhoItemCompactoParts: z.infer<
      typeof compactCartItemPartsSchema
    >;
    mensagemProdutoItemCompactoParts: z.infer<
      typeof compactCartItemPartsSchema
    >;
  };
}

/** Derived strings for debugging — not persisted as source of truth. */
export function whatsappDerivedTemplateStrings(
  whatsapp: Pick<
    WhatsappRaw,
    | "mensagemProdutoParts"
    | "mensagemCarrinhoParts"
    | "mensagemCarrinhoItemCompactoParts"
  >,
) {
  const normalized = normalizeWhatsappTemplates(whatsapp as WhatsappRaw);
  return {
    mensagemProduto: buildProductWaTemplate(normalized.mensagemProdutoParts),
    mensagemCarrinho: buildCartWaTemplate(normalized.mensagemCarrinhoParts),
    mensagemCarrinhoItemCompacto: buildCompactCartItemTemplate(
      normalized.mensagemCarrinhoItemCompactoParts,
    ),
  };
}
