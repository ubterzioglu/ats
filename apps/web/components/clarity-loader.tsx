"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { readConsent } from "@/lib/consent";

export function ClarityLoader() {
  const [loadClarity, setLoadClarity] = useState(false);

  useEffect(() => {
    const consent = readConsent();
    if (consent?.analytics) {
      setLoadClarity(true);
    }
  }, []);

  if (!loadClarity) return null;

  return (
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
  );
}
