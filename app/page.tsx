import { Analyzer } from "@/components/analyzer";
import { ComingSoon } from "@/components/coming-soon";
import { isPersistenceConfigured } from "@/lib/supabase/client";

// Prerendering would freeze isPersistenceConfigured() at image build time, so a
// container started with Supabase credentials would still hide the share button.
// Rendering per request lets the deployment platform supply them at runtime.
export const dynamic = "force-dynamic";

// The holding page is the default until launch: opening the analyzer takes the
// deliberate act of setting NEXT_PUBLIC_COMING_SOON=false, so a fresh or
// misconfigured deployment can never expose it by accident.

const DIMENSIONS: ReadonlyArray<{ readonly name: string; readonly weight: number; readonly what: string }> = [
  {
    name: "Parseability",
    weight: 25,
    what: "Whether the text layer survives extraction at all: columns, tables, icon fonts, broken encodings, letter-spacing."
  },
  {
    name: "Structure",
    weight: 20,
    what: "Headings a parser can map to fields, dated entries in reverse order, bullets instead of paragraphs."
  },
  {
    name: "Keyword match",
    weight: 25,
    what: "Coverage of the terms mined from the job ad, weighted by how central each one is to the posting."
  },
  {
    name: "Impact",
    weight: 20,
    what: "Quantified results, ownership verbs, and the absence of responsibility filler."
  },
  {
    name: "Contact",
    weight: 10,
    what: "The identity fields every system stores: name, email, phone, location, profile link."
  }
];

export default function HomePage() {
  if (process.env.NEXT_PUBLIC_COMING_SOON !== "false") return <ComingSoon />;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="font-mono text-lg font-medium tracking-tight">ats readability</h1>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
          Applicant tracking systems read a CV as text, not as a design. This shows you that text, scores what
          survives, and lists what to change — in order of how many points each fix is worth. The file is read in
          your browser and never uploaded.
        </p>
      </header>

      <Analyzer sharingEnabled={isPersistenceConfigured()} />

      <section className="mt-16 border-t border-line pt-8" aria-labelledby="method-heading">
        <h2 id="method-heading" className="text-sm font-semibold">
          How the 100 points are split
        </h2>

        <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {DIMENSIONS.map((dimension) => (
            <div key={dimension.name}>
              <dt className="flex items-baseline gap-2 text-sm font-medium">
                {dimension.name}
                <span className="font-mono text-xs text-muted">{dimension.weight}</span>
              </dt>
              <dd className="mt-1 max-w-measure text-sm leading-relaxed text-muted">{dimension.what}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 max-w-measure text-xs leading-relaxed text-muted">
          The checks are heuristics built from how mainstream parsers behave, not a reproduction of any specific
          vendor. A high score means nothing is standing between your CV and a human reader; it is not a
          prediction that you will be invited.
        </p>
      </section>
    </main>
  );
}
