import type {
  AboutPageModel,
  CartPageModel,
  CatalogPageModel,
  HomePageModel,
  ProductDetailModel,
} from "@/src/foundation/behaviors/view-models";
import type { Category, SiteConfig, SiteLayoutId } from "@/src/schemas";
import type { ReactNode } from "react";

export type { SiteLayoutId };

export type ChromeProps = {
  site: SiteConfig;
  categories: Category[];
};

export type HomeProps = HomePageModel;

export type NotFoundProps = {
  site: SiteConfig;
};

export type CatalogPageProps = CatalogPageModel;

export type ProductDetailProps = ProductDetailModel;

export type CartPageProps = CartPageModel;

export type AboutPageProps = AboutPageModel;

export type LayoutPreviewProps = {
  viewport: "desktop" | "mobile";
  storeName: string;
  heroSrc: string | null;
  heroes: { id: string; src: string | null; cta: string }[];
  faixaSrc: string | null;
  promoSrc: string | null;
  faixaCta: string;
  promoCta: string;
  slotIndex: (posicao: "hero" | "faixa" | "promo") => number;
};

export type SiteLayoutModule = {
  id: SiteLayoutId;
  Header: (props: ChromeProps) => ReactNode;
  Footer: (props: ChromeProps) => ReactNode;
  Home: (props: HomeProps) => ReactNode;
  NotFound: (props: NotFoundProps) => ReactNode;
  CatalogPage?: (props: CatalogPageProps) => ReactNode;
  ProductDetail?: (props: ProductDetailProps) => ReactNode;
  CartPage?: (props: CartPageProps) => ReactNode;
  AboutPage?: (props: AboutPageProps) => ReactNode;
  Preview?: (props: LayoutPreviewProps) => ReactNode;
};
