import { z } from "zod";
import { uuidSchema } from "@/src/schemas/common";

export const atelieHeroTextoModoSchema = z.enum(["herdar", "proprio", "oculto"]);
export type AtelieHeroTextoModo = z.infer<typeof atelieHeroTextoModoSchema>;

export const atelieHeroBotaoEstiloSchema = z.enum(["preenchido", "contorno"]);
export type AtelieHeroBotaoEstilo = z.infer<typeof atelieHeroBotaoEstiloSchema>;

export const atelieHeroBotaoAcaoSchema = z.enum([
  "herdar",
  "link",
  "whatsapp",
  "oculto",
]);
export type AtelieHeroBotaoAcao = z.infer<typeof atelieHeroBotaoAcaoSchema>;

function heroTexto(max: number, modo: AtelieHeroTextoModo) {
  return z
    .object({
      modo: atelieHeroTextoModoSchema.default(modo),
      texto: z.string().max(max).default(""),
    })
    .default({ modo, texto: "" });
}

function heroBotao(estilo: AtelieHeroBotaoEstilo) {
  return z
    .object({
      estilo: atelieHeroBotaoEstiloSchema.default(estilo),
      acao: atelieHeroBotaoAcaoSchema.default("herdar"),
      rotulo: z.string().max(80).default(""),
      href: z.string().max(500).default(""),
      mensagem: z.string().max(500).default(""),
    })
    .default({
      estilo,
      acao: "herdar",
      rotulo: "",
      href: "",
      mensagem: "",
    });
}

export const atelieHeroMidiaTipoSchema = z.enum(["nenhuma", "foto", "video"]);
export type AtelieHeroMidiaTipo = z.infer<typeof atelieHeroMidiaTipoSchema>;

export const atelieHeroMidiaOrigemSchema = z.enum(["upload", "link"]);
export type AtelieHeroMidiaOrigem = z.infer<typeof atelieHeroMidiaOrigemSchema>;

export const DEFAULT_ATELIE_HERO_MIDIA = {
  tipo: "nenhuma" as const,
  origem: "upload" as const,
  url: "",
  alt: "",
  arquivo: null as { id: string; path: string } | null,
};

export const atelieHeroMidiaSchema = z
  .object({
    tipo: atelieHeroMidiaTipoSchema.default("nenhuma"),
    origem: atelieHeroMidiaOrigemSchema.default("upload"),
    url: z.string().max(500).default(""),
    alt: z.string().max(200).default(""),
    arquivo: z
      .object({
        id: uuidSchema,
        path: z.string().min(1),
      })
      .nullable()
      .default(null),
  })
  .default(DEFAULT_ATELIE_HERO_MIDIA);

export const DEFAULT_ATELIE_HERO = {
  midia: DEFAULT_ATELIE_HERO_MIDIA,
  eyebrow: { modo: "herdar" as const, texto: "" },
  titulo: { modo: "herdar" as const, texto: "" },
  tituloDestaque: { modo: "oculto" as const, texto: "" },
  texto: { modo: "herdar" as const, texto: "" },
  nota: { modo: "oculto" as const, texto: "" },
  legendaTitulo: { modo: "oculto" as const, texto: "" },
  legendaTexto: { modo: "oculto" as const, texto: "" },
  botaoPrimario: {
    estilo: "preenchido" as const,
    acao: "herdar" as const,
    rotulo: "",
    href: "",
    mensagem: "",
  },
  botaoSecundario: {
    estilo: "contorno" as const,
    acao: "herdar" as const,
    rotulo: "",
    href: "",
    mensagem: "",
  },
};

export const atelieHeroSchema = z
  .object({
    midia: atelieHeroMidiaSchema,
    eyebrow: heroTexto(120, "herdar"),
    titulo: heroTexto(200, "herdar"),
    tituloDestaque: heroTexto(160, "oculto"),
    texto: heroTexto(800, "herdar"),
    nota: heroTexto(240, "oculto"),
    legendaTitulo: heroTexto(80, "oculto"),
    legendaTexto: heroTexto(160, "oculto"),
    botaoPrimario: heroBotao("preenchido"),
    botaoSecundario: heroBotao("contorno"),
  })
  .default(DEFAULT_ATELIE_HERO);

export const atelieLayoutConfigSchema = z
  .object({
    hero: atelieHeroSchema,
  })
  .default({ hero: DEFAULT_ATELIE_HERO });

export type AtelieHeroConfig = z.infer<typeof atelieHeroSchema>;
export type AtelieLayoutConfig = z.infer<typeof atelieLayoutConfigSchema>;
