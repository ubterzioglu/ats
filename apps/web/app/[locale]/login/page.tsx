import { getTranslations } from "next-intl/server";

import { ParticleField } from "@/components/ui/particle-field";
import { Link } from "@/i18n/navigation";

import { login, signup } from "./actions";
import { isLoginMessageKey } from "./messages";

interface LoginPageProps {
  readonly searchParams: Promise<{ readonly message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message: messageKey } = await searchParams;
  const t = await getTranslations("login");
  const brand = await getTranslations("brand");

  // Only a key this app issued is rendered; anything else in the query string
  // is ignored rather than printed onto the page.
  const message = isLoginMessageKey(messageKey) ? t(`messages.${messageKey}`) : null;

  return (
    <div className="relative overflow-hidden">
      <ParticleField shape="ambient" seed={5} className="absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-sm flex-col justify-center px-4 py-12">
        <Link href="/" className="text-nav-label text-ash transition-colors hover:text-bone">
          {brand("name")}
        </Link>

        {/* Dala inner-page adaptation: the form has no box; the particle field
            behind it carries the page. */}
        <h1 className="mt-10 text-heading-sm font-normal">{t("heading")}</h1>
        <p className="mt-4 text-body font-extralight text-mist">{t("lede")}</p>

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

          <div className="flex flex-col gap-1">
            <label className="text-caption uppercase text-ash" htmlFor="password">
              {t("passwordLabel")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              required
              className="field"
            />
          </div>

          {message ? (
            <p role="alert" className="border-l-2 border-saffron pl-4 text-sm text-saffron">
              {message}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <button formAction={login} className="btn">
              {t("submit")}
            </button>

            <button formAction={signup} className="btn-quiet">
              {t("createAccount")}
            </button>
          </div>
        </form>

        <p className="mt-10">
          <Link href="/" className="text-sm text-saffron underline underline-offset-4">
            {t("whatThisChecks")}
          </Link>
        </p>
      </div>
    </div>
  );
}
