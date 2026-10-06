import { getTranslations } from "next-intl/server";

import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { loadProfile } from "./profile-actions";

import { deleteAccount } from "./actions";
import { ProfileForm } from "./profile-form";

export default async function AccountPage() {
  await requireUser();
  const t = await getTranslations("account");
  const brand = await getTranslations("brand");

  const profileOutcome = await loadProfile();
  const profile = profileOutcome.state === "loaded" ? profileOutcome.profile : null;

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={5} className="absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col justify-center px-4 py-12">
        <Link href="/" className="text-nav-label text-ash transition-colors hover:text-bone">
          {brand("name")}
        </Link>

        <h1 className="mt-10 text-heading-sm font-normal">{t("heading")}</h1>
        <p className="mt-4 text-body font-extralight text-mist">{t("lede")}</p>

        <div className="mt-10 rounded-2xl border-2 border-bone/20 bg-void/50 p-6">
          <h2 className="text-caption uppercase text-ash">{t("profileHeading")}</h2>
          {profile ? (
            <ProfileForm profile={profile} />
          ) : (
            <p className="mt-4 text-sm text-mist">{t("profileEmpty")}</p>
          )}
        </div>

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
