# Personalização da vitrine (referência)

Configuração canônica: `data/configuracoes/site.json` (schema `SiteConfig` em `src/schemas/site-config.ts`).

## Matriz resumida (campo → superfície)

| Campo JSON | Onde aparece | Desktop / mobile |
|------------|--------------|------------------|
| `nomeLoja`, `assinatura`, `slogan`, `logo` | Header, footer, hero, metadata | Responsivo (CSS layout) |
| `cores.*`, `tema.*` | `--vn-*` em `app/layout.tsx` | Mesmas vars |
| `layout` | `data-layout` + `layout-tokens.css` | Grids 2→3→4 em `globals.css` @768/@1024 |
| `textos.home.*` | `*Home.tsx` (classic, split, gallery) | Idem |
| `textos.paginas.*` | Títulos de página, 404, sobre | Idem |
| `textos.catalogo.*` | `CatalogPageView`, `headerNav` busca | Filtros: sheet mobile / painel desktop |
| `textos.produto.*` | `ProductCard`, `ProductDetailClient`, `ProductVariantPicker` | Idem |
| `textos.carrinho.*` | `CartPageClient` | Idem |
| `textos.rodape.*`, `comportamento.rodapeUsarNavegacao` | `PublicFooterSections`, `footerContact` | Idem |
| `textos.cookies.*` | `ConsentBanner` | Fixo rodapé viewport |
| `textos.leadModal.*` | `ClientLeadModal` | Modal full-screen mobile |
| `comportamento.whatsappColetarLead` | `WhatsAppGateProvider` | Idem |
| `rotulos.dimensoes` | Filtros catálogo, picker PDP, admin variantes | Idem |
| `rotulos.navCategorias` | Menu `categorias` | Drawer / header |
| `vitrine.*` | Home limits, catálogo page size | Idem |
| `navegacao` | Header, drawer, topbar | `PublicMobileNav` @768 |
| `banners` + `ctaTexto` | Home banners | Imagens fluidas |

## Scripts de governança

- `npm run seed:validate` — valida `site.json` e catálogo.
- `npm run check:store-copy` — falha se strings vitrine conhecidas aparecerem em TSX sem usar `store-copy` / `site.textos` (ver `scripts/check-store-copy.ts`).
- `npm run data:migrate` — aplica migrations JSON pendentes (mesma ordem do boot). A migration inicial `2026-07-production-baseline` converte o modelo de produção (`variantes` com `tamanho`/`cor`, `site.json` enxuto, WhatsApp em string) para o schema atual; ledger em `configuracoes/migrations.json`.

## Variantes de produto

Produtos usam `variantes[].atributos` (chaves = `rotulos.dimensoes[].id`). Legado `tamanho`/`cor` é migrado no parse Zod e persistido pela migration `2026-07-product-variant-atributos` (boot ou CLI).

## Forks

Novos campos em `site.json` têm default no schema; forks antigos são atualizados pelas migrations no startup ou com `npm run data:migrate`.
