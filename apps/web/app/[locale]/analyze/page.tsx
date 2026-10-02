import { getTranslations, setRequestLocale } from "next-intl/server";

import { Analyzer } from "@/components/analyzer";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { isPersistenceConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

import { logout } from "../login/actions";

// isPersistenceConfigured() reads the environment, which prerendering would
// freeze at image build time; rendering per request lets the deployment
// platform supply credentials at runtime.
export const dynamic = "force-dynamic";

interface AnalyzePageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

async function hasSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user !== null;
  } catch {
    return false;
  }
}

export default async function AnalyzePage({ params }: AnalyzePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("analyze");
  const common = await getTranslations("common");
  const brand = await getTranslations("brand");
  const signedIn = await hasSession();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-line py-5">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent"
        >
          {brand("name")}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {signedIn ? (
            <form action={logout}>
              <button className="text-sm text-muted transition-colors hover:text-ink">
                {common("signOut")}
              </button>
            </form>
          ) : (
            <Link href="/login" className="text-sm text-muted transition-colors hover:text-ink">
              {common("signInToSave")}
            </Link>
          )}
        </div>
      </header>

      <main className="py-8 sm:py-10">
        <div className="mb-8 max-w-measure">
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("heading")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("lede")}</p>
        </div>

        <Analyzer sharingEnabled={isPersistenceConfigured()} />
      </main>

      <footer className="border-t border-line py-8">
        <p className="max-w-measure text-sm leading-relaxed text-muted">{common("disclaimer")}</p>
      </footer>
    </div>
  );
}
