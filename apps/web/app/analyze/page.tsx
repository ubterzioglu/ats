import Link from "next/link";

import { Analyzer } from "@/components/analyzer";
import { logout } from "@/app/login/actions";
import { isPersistenceConfigured } from "@/lib/supabase/client";

// isPersistenceConfigured() reads the environment, which prerendering would
// freeze at image build time; rendering per request lets the deployment
// platform supply credentials at runtime.
export const dynamic = "force-dynamic";

export default function AnalyzePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-line py-5">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight transition-colors hover:text-accent">
          ats readability
        </Link>
        <form action={logout}>
          <button className="text-sm text-muted transition-colors hover:text-ink">Sign out</button>
        </form>
      </header>

      <main className="py-8 sm:py-10">
        <div className="mb-8 max-w-measure">
          <h1 className="text-2xl font-semibold sm:text-3xl">See what the parser gets</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Upload the exact file you send to employers. The text below is what an applicant tracking
            system would extract — correct it if the extraction went wrong, then score it against the ad.
          </p>
        </div>

        <Analyzer sharingEnabled={isPersistenceConfigured()} />
      </main>

      <footer className="border-t border-line py-8">
        <p className="max-w-measure text-sm leading-relaxed text-muted">
          The checks are heuristics built from how mainstream parsers behave, not a reproduction of any
          named vendor. A good score means nothing is standing between your CV and a human reader; it is
          not a prediction that you will be invited.
        </p>
      </footer>
    </div>
  );
}
