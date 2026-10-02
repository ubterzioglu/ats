import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { routing } from "@/i18n/routing";
import { THEME_SCRIPT } from "@/lib/theme";

import "../globals.css";

// Everything the interface says. No `weight` list and an explicit `wdth` axis:
// requesting fixed weights serves static instances, and the width axis - which
// the rail uses to mark dense data labels - would silently fall back to normal.
const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-sans",
  display: "swap"
});

// Reserved for what the machine produced: extracted text, counts, matched
// terms, point values. latin-ext, because extracted Turkish and German CV text
// renders in it.
const mono = DM_Mono({
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

// Both values, so the browser chrome follows the theme instead of staying at
// the light canvas colour once dark exists.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F8" },
    { media: "(prefers-color-scheme: dark)", color: "#12161D" }
  ]
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts the route into static rendering; without it every page under this
  // layout becomes dynamic the moment it reads a message.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
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
