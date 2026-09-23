import type { Banner, Category, ProductListItem, SiteConfig, SiteLayoutId } from "@/src/schemas";
import type { ReactNode } from "react";
import type { CatalogViewQuery } from "@/components/public/kit/catalog/CatalogPageView";
import type { ProductDetailProps } from "@/components/public/kit/product/ProductDetailClient";

export type { SiteLayoutId };
export type { ProductDetailProps };

export type ChromeProps = {
  site: SiteConfig;
  categories: Category[];
};

export type HomeProps = {
  site: SiteConfig;
  categories: Category[];
  banners: Banner[];
  destaques: ProductListItem[];
  novos: ProductListItem[];
  /** Public products shown when both destaques and novos are empty. */
  vitrineFallback: ProductListItem[];
  wa: string;
};

export type NotFoundProps = {
  site: SiteConfig;
};

export type CatalogPageProps = {
  query: CatalogViewQuery;
};

export type CartPageProps = {
  site: SiteConfig;
};

export type AboutPageProps = {
  site: SiteConfig;
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
};
