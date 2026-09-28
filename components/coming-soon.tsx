import Image from "next/image";

/** Provisional address for the holding page; replace before the launch copy is final. */
const CONTACT_EMAIL = "asfreeforall@ubterzioglu.de";

interface Weight {
  readonly name: string;
  readonly points: number;
  readonly bar: string;
  readonly what: string;
}

/** Bar widths are the point weight over the 25 a dimension can carry at most. */
const WEIGHTS: ReadonlyArray<Weight> = [
  { name: "Parseability", points: 25, bar: "w-full", what: "Columns, tables, icon fonts, broken encodings" },
  { name: "Keyword match", points: 25, bar: "w-full", what: "Terms mined from the job ad you are answering" },
  { name: "Structure", points: 20, bar: "w-4/5", what: "Headings, dated entries, bullets over paragraphs" },
  { name: "Impact", points: 20, bar: "w-4/5", what: "Quantified results and ownership verbs" },
  { name: "Contact", points: 10, bar: "w-2/5", what: "Name, email, phone, location, profile link" }
];

/** What a parser pulls out of a two-column CV: order lost, glyphs dropped. */
function ParsedLayer() {
  return (
    <div className="space-y-[0.4rem] p-5 font-mono text-[0.6rem] leading-snug text-muted sm:p-6 sm:text-[0.68rem]">
      <p className="text-ink">BARIS TERZIOGLU</p>
      <p>
        b a r i s <span className="text-mark">@</span> e x a m p l e . c o m
      </p>
      <p className="text-mark">(cid:12)(cid:9) +49 151 (cid:3)(cid:3)(cid:3)</p>
      <p className="pt-2">EXPERIENCE Kubernetes Senior</p>
      <p>Engineer Docker 2019 - PostgreSQL</p>
      <p>present Terraform Led the</p>
      <p>migration of 14 services Go</p>
      <p className="text-mark">EDUCATION ??? Python React</p>
      <p>BSc Computer Science CI/CD</p>
      <p className="pt-2 text-mark">[image] [image] [image]</p>
    </div>
  );
}

/** The same page before the parser touches it: two columns, a photo, a table. */
function IntactLayer() {
  return (
    <div className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-3 border-b border-line pb-3">
        <div className="h-10 w-10 shrink-0 rounded-sheet bg-ink/15" />
        <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
          <div className="h-2.5 w-28 rounded-sm bg-ink/70" />
          <div className="h-1.5 w-36 rounded-sm bg-muted/40" />
        </div>
      </div>

      <div className="flex flex-1 gap-4 pt-3">
        <div className="flex-1 space-y-2">
          <div className="h-1.5 w-20 rounded-sm bg-signal" />
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="h-1.5 rounded-sm bg-muted/25" />
          ))}
          <div className="h-1.5 w-3/4 rounded-sm bg-muted/25" />
        </div>

        <div className="w-[38%] space-y-2 border-l border-line pl-4">
          <div className="h-1.5 w-14 rounded-sm bg-signal" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-1.5">
              <div className="h-1.5 flex-1 rounded-sm bg-muted/25" />
              <div className="h-1.5 w-5 rounded-sm bg-good/50" />
            </div>
          ))}
          <div className="h-1.5 w-16 rounded-sm bg-muted/25" />
        </div>
      </div>
    </div>
  );
}

export function ComingSoon() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h1 className="font-mono text-3xl font-medium tracking-tight sm:text-4xl">ats readability</h1>

          <p className="mt-5 max-w-measure text-base leading-relaxed text-muted sm:text-lg">
            An applicant tracking system reads your CV as text, not as a design. This shows you the text it
            actually gets, scores what survives, and lists what to fix.
          </p>

          <p className="mt-6 flex items-center gap-2.5 text-sm">
            <span className="scan-status inline-block h-2 w-2 shrink-0 rounded-full bg-signal" aria-hidden="true" />
            Coming soon. The CV is read in your browser and never uploaded.
          </p>

          <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
            Questions:{" "}
            <a className="font-mono underline underline-offset-4 hover:text-ink" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <figure className="m-0">
          <div className="sheet relative isolate aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
            <div className="absolute inset-0">
              <ParsedLayer />
            </div>

            <div className="scan-intact absolute inset-0 bg-sheet">
              <IntactLayer />
            </div>

            <div className="scan-beam absolute inset-x-0 top-0 z-10 h-px bg-signal shadow-[0_0_14px_3px_rgb(var(--signal)/0.55)]" />
          </div>

          <figcaption className="mt-3 max-w-measure text-xs leading-relaxed text-muted">
            Below the line, the CV as it was designed. Above it, the same page after extraction: columns
            interleaved, the address broken apart, glyphs the font never embedded.
          </figcaption>
        </figure>
      </div>

      <section className="mt-16 border-t border-line pt-8 sm:mt-20" aria-labelledby="weights-heading">
        <h2 id="weights-heading" className="text-sm font-semibold">
          How the 100 points are split
        </h2>

        <dl className="mt-6 space-y-4">
          {WEIGHTS.map((weight) => (
            <div key={weight.name} className="grid gap-x-4 gap-y-1 sm:grid-cols-[9rem_5rem_minmax(0,1fr)]">
              <dt className="rail-label">{weight.name}</dt>
              <div className="ruler flex h-1.5 items-stretch self-center rounded-sm" aria-hidden="true">
                <div className={`${weight.bar} rounded-sm bg-ink`} />
              </div>
              <dd className="text-sm leading-relaxed text-muted">
                <span className="font-mono text-xs tabular-nums text-ink sm:hidden">{weight.points} </span>
                {weight.what}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <figure className="mt-16 border-t border-line pt-8 sm:mt-20">
        <Image
          src="/bu-aci-geciyor-mu.png"
          alt="Stencil graffiti of a face beside the handwritten question: bu acı geçiyor mu?"
          width={895}
          height={466}
          unoptimized
          className="w-full max-w-sm rounded-sheet border border-line"
        />
        <figcaption className="mt-3 max-w-measure text-xs leading-relaxed text-muted">
          Bu acı geçiyor mu? Geçiyor.
        </figcaption>
      </figure>
    </main>
  );
}
