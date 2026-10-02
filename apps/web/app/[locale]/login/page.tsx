import { getTranslations } from "next-intl/server";

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
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-12">
      <Link
        href="/"
        className="font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
      >
        {brand("name")}
      </Link>

      <div className="sheet mt-6 p-7">
        <h1 className="text-xl font-semibold">{t("heading")}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("lede")}</p>

        <form className="mt-7 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="rail-label" htmlFor="email">
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

          <div className="flex flex-col gap-1.5">
            <label className="rail-label" htmlFor="password">
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
            <p
              role="alert"
              className="rounded-control border border-caution/35 bg-caution/[0.07] px-3.5 py-3 text-sm text-caution"
            >
              {message}
            </p>
          ) : null}

          <button formAction={login} className="btn mt-2">
            {t("submit")}
          </button>

          <button formAction={signup} className="btn-quiet">
            {t("createAccount")}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/" className="underline underline-offset-2 transition-colors hover:text-ink">
          {t("whatThisChecks")}
        </Link>
      </p>
    </div>
  );
}
