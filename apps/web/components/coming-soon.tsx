import Image from "next/image";

const CONTACT_EMAIL = "ubterzioglu@gmail.com";

/** What a parser pulls out of a two-column CV: order lost, glyphs dropped. */
const PARSED_LINES: ReadonlyArray<{ readonly text: string; readonly lost?: boolean }> = [
  { text: "EXPERIENCE Kubernetes Senior" },
  { text: "Engineer Docker 2019 - PostgreSQL" },
  { text: "present Terraform Led the" },
  { text: "migration of 14 services Go" },
  { text: "cutting deploy time from 40 CI/CD" },
  { text: "to 12 minutes React Owned the" },
  { text: "EDUCATION ??? Python Redis", lost: true },
  { text: "BSc Computer Science 2014 Rust" },
  { text: "Technical University AWS Berlin" },
  { text: "(cid:7)(cid:7) LANGUAGES Terraform", lost: true },
  { text: "Turkish native German C1 Linux" },
  { text: "English C2 CERTIFICATIONS Git" },
  { text: "[image] [image] [image]", lost: true },
  { text: "AWS Solutions Architect 2023" },
  { text: "Referenzen auf Anfrage (cid:3)", lost: true }
];

function ParsedLayer() {
  return (
    <div className="flex h-full flex-col gap-[0.35rem] p-5 font-mono text-[0.58rem] leading-snug text-muted sm:p-6 sm:text-[0.66rem]">
      <p className="text-ink">BARIS TERZIOGLU</p>
      <p>
        b a r i s <span className="text-mark">@</span> e x a m p l e . c o m
      </p>
      <p className="pb-1 text-mark">(cid:12)(cid:9) +49 151 (cid:3)(cid:3)(cid:3)</p>
      {PARSED_LINES.map((line) => (
        <p key={line.text} className={line.lost ? "text-mark" : undefined}>
          {line.text}
        </p>
      ))}
    </div>
  );
}

/** Ragged widths so the blocks read as prose rather than as a chart. */
const MAIN_COLUMN: ReadonlyArray<{ readonly heading: string; readonly lines: readonly string[] }> = [
  { heading: "w-20", lines: ["w-full", "w-[96%]", "w-[88%]", "w-[72%]"] },
  { heading: "w-16", lines: ["w-full", "w-[92%]", "w-full", "w-[64%]"] },
  { heading: "w-24", lines: ["w-[94%]", "w-full", "w-[80%]"] }
];

const SIDE_ROWS: readonly string[] = ["w-10", "w-[3.2rem]", "w-8", "w-[3.6rem]", "w-[2.8rem]"];

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

      <div className="flex flex-1 gap-4 pt-4">
        <div className="flex flex-1 flex-col gap-2.5">
          {MAIN_COLUMN.map((block, index) => (
            <div key={`${block.heading}-${index}`} className="space-y-2">
              <div className={`h-1.5 rounded-sm bg-signal ${block.heading}`} />
              {block.lines.map((width, line) => (
                <div key={line} className={`h-1.5 rounded-sm bg-muted/30 ${width}`} />
              ))}
            </div>
          ))}
        </div>

        <div className="flex w-[38%] flex-col gap-2.5 border-l border-line pl-4">
          <div className="h-1.5 w-14 rounded-sm bg-signal" />
          {SIDE_ROWS.map((width, row) => (
            <div key={row} className="flex items-center gap-1.5">
              <div className={`h-1.5 shrink-0 rounded-sm bg-muted/30 ${width}`} />
              <div className="h-1.5 flex-1 rounded-sm bg-good/40" />
            </div>
          ))}
          <div className="mt-1 h-1.5 w-16 rounded-sm bg-signal" />
          <div className="h-1.5 w-full rounded-sm bg-muted/30" />
          <div className="h-1.5 w-2/3 rounded-sm bg-muted/30" />
        </div>
      </div>
    </div>
  );
}

export function ComingSoon() {
  return (
    <>
      <div className="bg-signal text-ink">
        <p className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-2 text-sm font-medium sm:px-6">
          <span className="scan-status inline-block h-2 w-2 shrink-0 rounded-full bg-ink" aria-hidden="true" />
          Coming soon
        </p>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h1 className="font-mono text-3xl font-medium tracking-tight sm:text-4xl">ats readability</h1>

          <p className="mt-5 max-w-measure text-base leading-relaxed text-muted sm:text-lg">
            An applicant tracking system reads your CV as text, not as a design. This shows you the text it
            actually gets, scores what survives, and lists what to fix.
          </p>

          <p className="mt-6 max-w-measure text-sm leading-relaxed">
            The CV is read in your browser and never uploaded.
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

            <div className="scan-beam absolute inset-x-0 top-0 z-10 h-0.5 bg-signal shadow-[0_0_22px_6px_rgb(var(--signal)/0.7)]" />
          </div>

          <figcaption className="mt-3 max-w-measure text-xs leading-relaxed text-muted">
            Below the line, the CV as it was designed. Above it, the same page after extraction: columns
            interleaved, the address broken apart, glyphs the font never embedded.
          </figcaption>
        </figure>
        </div>

        <figure className="mt-16 sm:mt-20">
          <Image
            src="/yakinda-geliyor.png"
            alt="ATSFreeForAll.com — Yakında geliyor. Tüm özellikleri bedava olarak. Bizi izlemeye devam ediniz."
            width={1672}
            height={941}
            unoptimized
            priority={false}
            className="w-full rounded-sheet border border-line"
          />
        </figure>
      </main>
    </>
  );
}
