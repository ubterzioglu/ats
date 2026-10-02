import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { routing } from "@/i18n/routing";

import "../globals.css";

// Headings and running prose. A CV is a document, and the serif says so before
// any copy does.
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-serif",
  display: "swap"
});

const sans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap"
});

// Reserved for what the parser produced: extracted text, counts, matched terms.
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap"
});

interface LocaleLayoutProps {
  readonly children: ReactNode;
  readonly params: Promise<{ readonly locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: t("defaultTitle"),
      template: t("titleTemplate")
    },
    description: t("description"),
    openGraph: {
      type: "website",
      title: t("openGraphTitle"),
      description: t("openGraphDescription")
    },
    robots: { index: true, follow: true }
  };
}

export const viewport: Viewport = {
  themeColor: "#F6F7FA"
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts the route into static rendering; without it every page under this
  // layout becomes dynamic the moment it reads a message.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "yr25yt3zqx");
            `
          }}
        />
      </body>
    </html>
  );
}
