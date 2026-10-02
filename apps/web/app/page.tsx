import Link from "next/link";

import { ParseSweep } from "@/components/parse-sweep";

const DIMENSIONS: ReadonlyArray<{
  readonly name: string;
  readonly weight: number;
  readonly what: string;
}> = [
  {
    name: "Parseability",
    weight: 25,
    what: "Whether the text layer survives extraction at all: columns, tables, icon fonts, broken encodings."
  },
  {
    name: "Keyword match",
    weight: 25,
    what: "Coverage of the terms mined from the job ad, weighted by how central each one is to the posting."
  },
  {
    name: "Impact",
    weight: 20,
    what: "Quantified results and ownership verbs, measured against responsibility filler."
  },
  {
    name: "Structure",
    weight: 20,
    what: "Headings a parser can map to fields, dated entries in reverse order, bullets instead of paragraphs."
  },
  {
    name: "Contact",
    weight: 10,
    what: "The identity fields every system stores: name, email, phone, location, profile link."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-5">
        <span className="font-mono text-sm font-medium tracking-tight">ats readability</span>
        <Link href="/login" className="text-sm text-muted transition-colors hover:text-ink">
          Sign in
        </Link>
      </header>

      <main>
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[1fr_minmax(0,27rem)] lg:gap-14 lg:py-16">
          <div>
            <h1 className="max-w-[14ch] text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              Your CV is read as text, not as a design.
            </h1>

            <p className="mt-6 max-w-measure text-base leading-relaxed text-muted sm:text-lg">
              An applicant tracking system throws away your layout and keeps whatever text it can pull
              out. This shows you that text, scores what survived out of 100, and lists what to change —
              ordered by how many points each fix is worth.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/analyze" className="btn">
                Analyze a CV
              </Link>
              <Link href="/login" className="btn-quiet">
                Sign in to save reports
              </Link>
            </div>

            <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted">
              The file is read in your browser and scored there. It is never uploaded.
            </p>
          </div>

          <ParseSweep />
        </section>

        <section className="border-t border-line py-12 lg:py-16" aria-labelledby="method-heading">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
            <div className="lg:sticky lg:top-10 lg:self-start">
              <h2 id="method-heading" className="text-2xl font-semibold">
                How the 100 points are split
              </h2>
              <p className="mt-4 max-w-measure text-sm leading-relaxed text-muted">
                Each dimension starts at its full weight and loses points only to a named finding, so the
                report can always tell you where a missing point went.
              </p>
              <p className="mt-4 max-w-measure text-sm leading-relaxed text-muted">
                Nothing here is a black box: every deduction names the line it came from and what to write
                instead.
              </p>
            </div>

            <dl className="space-y-7">
              {DIMENSIONS.map((dimension) => (
                <div key={dimension.name}>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm font-medium">{dimension.name}</dt>
                    <span className="readout text-ink">{dimension.weight}</span>
                  </div>
                  <div
                    aria-hidden
                    className="ruler mt-2 h-1.5 overflow-hidden rounded-full border border-line bg-sheet"
                  >
                    <div className="h-full bg-accent/70" style={{ width: `${dimension.weight}%` }} />
                  </div>
                  <dd className="mt-2.5 max-w-measure text-sm leading-relaxed text-muted">
                    {dimension.what}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
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
