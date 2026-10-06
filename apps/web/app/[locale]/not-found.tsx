import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { Sparkle } from "@/components/home/sparkle";
import { GhostLink } from "@/components/ui/ghost-link";
import { ParticleField } from "@/components/ui/particle-field";
import { PrimaryButton } from "@/components/ui/primary-button";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false }
  };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="relative flex min-h-[calc(100dvh-5rem)] items-center justify-center overflow-hidden">
      <ParticleField shape="ambient" seed={3} className="absolute inset-0" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-12 text-center sm:px-6">
        <div
          aria-hidden="true"
          className="sticker sticker-lime relative mx-auto inline-block px-10 py-4 sm:px-14 sm:py-6"
          style={{ "--tilt": "-5deg" } as CSSProperties}
        >
          <span className="font-display text-[5.5rem] font-extrabold leading-none tracking-tighter sm:text-[9rem]">
            404
          </span>
          <Sparkle className="absolute -right-5 -top-6 h-14 w-14 sm:-right-7 sm:-top-8 sm:h-20 sm:w-20" />
        </div>
        <h1 className="mt-12 text-heading-sm font-extrabold text-bone sm:text-heading">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-measure text-body text-mist">{t("body")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <PrimaryButton href="/">{t("home")}</PrimaryButton>
          <GhostLink href="/analyze">{t("analyze")}</GhostLink>
        </div>
      </div>
    </main>
  );
}
