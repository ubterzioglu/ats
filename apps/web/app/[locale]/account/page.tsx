import { getTranslations } from "next-intl/server";

import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/require-user";

import { deleteAccount } from "./actions";

export default async function AccountPage() {
  await requireUser();
  const t = await getTranslations("account");
  const brand = await getTranslations("brand");

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={5} className="absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-sm flex-col justify-center px-4 py-12">
        <Link href="/" className="text-nav-label text-ash transition-colors hover:text-bone">
          {brand("name")}
        </Link>

        <h1 className="mt-10 text-heading-sm font-normal">{t("heading")}</h1>
        <p className="mt-4 text-body font-extralight text-mist">{t("lede")}</p>

        <div className="mt-10 rounded-2xl border-2 border-bone/20 bg-void/50 p-6">
          <h2 className="text-caption uppercase text-ash">{t("dangerZone")}</h2>
          <p className="mt-2 text-sm text-mist">{t("deleteWarning")}</p>
          <form className="mt-4">
            <button formAction={deleteAccount} className="btn-quiet border-caution text-caution hover:bg-caution/10">
              {t("deleteAccount")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
