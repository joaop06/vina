import type { AtelieHeroBotaoEstilo, AtelieHeroConfig } from "@/src/schemas/atelie-hero";
import { waLink } from "@/src/foundation/behaviors/whatsapp/wa";

export type AtelieHeroCopy = {
  eyebrow: string | null;
  titulo: string | null;
  tituloDestaque: string | null;
  texto: string | null;
  nota: string | null;
  legendaTitulo: string | null;
  legendaTexto: string | null;
};

export type AtelieHeroAction = {
  estilo: AtelieHeroBotaoEstilo;
  kind: "link" | "whatsapp";
  rotulo: string;
  href: string;
};

export type AtelieHeroSources = {
  assinatura: string;
  nomeLoja: string;
  slogan: string;
  verColecao: string;
  whatsappCurto: string;
  whatsappMostrar: boolean;
  telefone: string;
  mensagemPadrao: string;
};

function resolveTexto(
  field: { modo: "herdar" | "proprio" | "oculto"; texto: string },
  inherited: string | null,
): string | null {
  if (field.modo === "oculto") return null;
  const raw = field.modo === "proprio" ? field.texto : (inherited ?? "");
  const texto = raw.trim();
  return texto || null;
}

function isHref(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function resolveBotao(
  botao: AtelieHeroConfig["botaoPrimario"],
  papel: "primario" | "secundario",
  sources: AtelieHeroSources,
): AtelieHeroAction | null {
  if (botao.acao === "oculto") return null;

  if (botao.acao === "herdar") {
    if (papel === "primario") {
      const rotulo = sources.verColecao.trim();
      if (!rotulo) return null;
      return {
        estilo: botao.estilo,
        kind: "link",
        rotulo,
        href: "/catalogo",
      };
    }
    if (!sources.whatsappMostrar) return null;
    const rotulo = sources.whatsappCurto.trim();
    if (!rotulo) return null;
    return {
      estilo: botao.estilo,
      kind: "whatsapp",
      rotulo,
      href: waLink(sources.telefone, sources.mensagemPadrao),
    };
  }

  if (botao.acao === "link") {
    const rotulo = botao.rotulo.trim();
    const href = botao.href.trim();
    if (!rotulo || !isHref(href)) return null;
    return { estilo: botao.estilo, kind: "link", rotulo, href };
  }

  if (!sources.whatsappMostrar) return null;
  const rotulo = botao.rotulo.trim();
  if (!rotulo) return null;
  const mensagem = botao.mensagem.trim() || sources.mensagemPadrao;
  return {
    estilo: botao.estilo,
    kind: "whatsapp",
    rotulo,
    href: waLink(sources.telefone, mensagem),
  };
}

export function resolveAtelieHero(
  hero: AtelieHeroConfig,
  sources: AtelieHeroSources,
): { copy: AtelieHeroCopy; actions: AtelieHeroAction[] } {
  const copy: AtelieHeroCopy = {
    eyebrow: resolveTexto(hero.eyebrow, sources.assinatura),
    titulo: resolveTexto(hero.titulo, sources.nomeLoja),
    tituloDestaque: resolveTexto(hero.tituloDestaque, null),
    texto: resolveTexto(hero.texto, sources.slogan),
    nota: resolveTexto(hero.nota, null),
    legendaTitulo: resolveTexto(hero.legendaTitulo, null),
    legendaTexto: resolveTexto(hero.legendaTexto, null),
  };
  const actions = [
    resolveBotao(hero.botaoPrimario, "primario", sources),
    resolveBotao(hero.botaoSecundario, "secundario", sources),
  ].filter((action): action is AtelieHeroAction => action != null);
  return { copy, actions };
}
