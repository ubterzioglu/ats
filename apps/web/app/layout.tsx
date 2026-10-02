import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "ATS readability — see your CV the way the parser does",
    template: "%s · ATS readability"
  },
  description:
    "Read a CV the way an applicant tracking system reads it: what parses, what is missing, and which terms from the job ad never appear. Runs entirely in the browser.",
  openGraph: {
    type: "website",
    title: "ATS readability",
    description: "See your CV the way the parser does. Nothing is uploaded."
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#F6F7FA"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
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
