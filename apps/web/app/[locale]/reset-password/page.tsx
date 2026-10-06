import { getTranslations } from "next-intl/server";

import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";

import { resetPassword } from "../login/actions";

interface ResetPasswordPageProps {
  readonly searchParams: Promise<{ readonly message?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { message: messageKey } = await searchParams;
  const t = await getTranslations("login");
  const brand = await getTranslations("brand");

  const message = messageKey === "signupFailed" ? t("messages.signupFailed") : null;

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={5} className="absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-sm flex-col justify-center px-4 py-12">
        <Link href="/" className="text-nav-label text-ash transition-colors hover:text-bone">
          {brand("name")}
        </Link>

        <h1 className="mt-10 text-heading-sm font-normal">{t("resetPassword.heading")}</h1>
        <p className="mt-4 text-body font-extralight text-mist">{t("resetPassword.lede")}</p>

        <form className="mt-10 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-caption uppercase text-ash" htmlFor="password">
              {t("passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              required
              minLength={8}
              className="field"
            />
          </div>

          {message ? (
            <p role="alert" className="border-l-2 border-saffron pl-4 text-sm text-saffron">
              {message}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <button formAction={resetPassword} className="btn">
              {t("resetPassword.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
