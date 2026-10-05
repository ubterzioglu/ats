import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { routing, type AppLocale } from "@/i18n/routing";
import { OPEN_GRAPH_LOCALE } from "@/lib/seo";
import { ByokConsentListener } from "@/components/byok-consent-listener";
import { NavBar } from "@/components/ui/nav-bar";

import "../globals.css";

// Everything the interface says. PPNeueMontreal is not licensed here, so Inter
// stands in with the same convention: 200 for body copy, 400 for headings, 600
// for labels. No `weight` list, so the variable file serves every weight.
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
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
      siteName: "ATS readability",
      locale: OPEN_GRAPH_LOCALE[locale as AppLocale],
      title: t("openGraphTitle"),
      description: t("openGraphDescription")
    },
    robots: { index: true, follow: true }
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark"
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts the route into static rendering; without it every page under this
  // layout becomes dynamic the moment it reads a message.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={sans.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <NavBar />
          {children}
          {/* Inside the provider, not beside it: the listener reads messages,
              and a client component outside the provider has no context to
              read them from. */}
          <ByokConsentListener />
        </NextIntlClientProvider>
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
