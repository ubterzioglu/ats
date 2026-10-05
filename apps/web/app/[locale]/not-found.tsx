import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

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
    <main className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden">
      <ParticleField shape="ambient" seed={3} className="absolute inset-0" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-12 text-center sm:px-6">
        <p className="text-display font-normal text-bone">404</p>
        <p className="mt-2 text-micro font-normal text-signal">
          {t("code")}
        </p>
        <h1 className="mt-6 text-heading-sm font-normal text-bone">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-measure text-sm leading-relaxed text-muted">
          {t("body")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <PrimaryButton href="/">{t("home")}</PrimaryButton>
          <GhostLink href="/analyze">{t("analyze")}</GhostLink>
        </div>
      </div>
    </main>
  );
}
