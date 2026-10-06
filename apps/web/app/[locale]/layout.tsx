import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { routing, type AppLocale } from "@/i18n/routing";
import { OPEN_GRAPH_LOCALE } from "@/lib/seo";
import { ByokConsentListener } from "@/components/byok-consent-listener";
import { ClarityLoader } from "@/components/clarity-loader";
import { ConsentBanner } from "@/components/consent-banner";
import { HelpStack } from "@/components/help/help-stack";
import { NavBar } from "@/components/ui/nav-bar";

import "../globals.css";

// Body copy and interface text. No `weight` list, so the variable file serves
// every weight.
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap"
});

// The wordmark in the logo is set in a heavy geometric sans of this kind;
// headlines, buttons and chips use it so the type matches the mark.
const display = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
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
    twitter: {
      card: "summary_large_image",
      title: t("openGraphTitle"),
      description: t("openGraphDescription")
    },
    robots: { index: true, follow: true },
    alternates: {
      types: {
        "application/atom+xml": "/feed.xml"
      }
    }
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
    <html lang={locale} className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-iris focus:text-white focus:px-4 focus:py-2 focus:rounded">
          Skip to main content
        </a>
        <NextIntlClientProvider>
          <NavBar />
          <main id="main-content">
            {children}
          </main>
          {/* Inside the provider, not beside it: the listener reads messages,
              and a client component outside the provider has no context to
              read them from. */}
          <ByokConsentListener />
          <ConsentBanner />
          <HelpStack />
          <ClarityLoader />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
