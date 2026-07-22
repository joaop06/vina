import type { SiteLayoutId } from "@/src/schemas/site-config";

export const SITE_LAYOUT_OPTIONS: Array<{
  id: SiteLayoutId;
  nome: string;
  descricao: string;
}> = [
  {
    id: "classic",
    nome: "Clássico",
    descricao: "Hero centrado com gradiente, marca em destaque e CTAs lado a lado.",
  },
  {
    id: "split",
    nome: "Dividido",
    descricao: "Split 50/50 vermelho/preto, busca no cabeçalho e arte da pegada.",
  },
  {
    id: "gallery",
    nome: "Galeria",
    descricao:
      "Carrossel full-bleed no topo, ritmo editorial e categorias em destaque.",
  },
];
