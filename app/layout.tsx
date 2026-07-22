import { Bebas_Neue, Poppins } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./layout-tokens.css";
import { getCachedSiteConfig } from "@/src/lib/cache/storefront-reads";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-lookbook",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCachedSiteConfig();
  // Icons: app/icon.tsx + app/apple-icon.tsx. Query busts browser favicon cache.
  const iconVersion = site.logo?.id ?? site.versao;
  return {
    title: {
      default: `${site.nomeLoja} — ${site.assinatura}`,
      template: `%s · ${site.nomeLoja}`,
    },
    description: site.slogan,
    icons: {
      icon: [{ url: `/icon?v=${iconVersion}` }],
      apple: [{ url: `/apple-icon?v=${iconVersion}` }],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const site = await getCachedSiteConfig();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: site.cores.primaria,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getCachedSiteConfig();
  return (
    <html
      lang="pt-BR"
      data-layout={site.layout}
      style={
        {
          "--pq-red": site.cores.primaria,
          "--pq-black": site.cores.secundaria,
          "--pq-white": site.cores.fundo,
          "--pq-gray-50": site.cores.fundoNeutro,
          "--pq-gray-border": site.cores.borda,
        } as React.CSSProperties
      }
    >
      <body
        className={`${poppins.variable} ${bebasNeue.variable} antialiased`}
        data-layout={site.layout}
      >
        {children}
      </body>
    </html>
  );
}
