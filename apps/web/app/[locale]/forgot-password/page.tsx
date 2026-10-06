import { getTranslations } from "next-intl/server";

import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";

import { forgotPassword } from "../login/actions";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("login");
  const brand = await getTranslations("brand");

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={5} className="absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-sm flex-col justify-center px-4 py-12">
        <Link href="/" className="text-nav-label text-ash transition-colors hover:text-bone">
          {brand("name")}
        </Link>

        <h1 className="mt-10 text-heading-sm font-normal">{t("forgotPassword.heading")}</h1>
        <p className="mt-4 text-body font-extralight text-mist">{t("forgotPassword.lede")}</p>

        <form className="mt-10 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-caption uppercase text-ash" htmlFor="email">
              {t("emailLabel")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              required
              className="field"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <button formAction={forgotPassword} className="btn">
              {t("forgotPassword.submit")}
            </button>
          </div>
        </form>

        <p className="mt-10">
          <Link href="/login" className="text-sm text-saffron underline underline-offset-4">
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
