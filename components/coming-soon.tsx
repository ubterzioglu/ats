/** Provisional address for the holding page; replace before the launch copy is final. */
const CONTACT_EMAIL = "asfreeforall@ubterzioglu.de";

const CHECKS: ReadonlyArray<{ readonly name: string; readonly what: string }> = [
  { name: "Parseability", what: "Columns, tables, icon fonts, broken encodings, letter-spacing" },
  { name: "Structure", what: "Headings a parser can map to fields, dated entries, bullets over paragraphs" },
  { name: "Keyword match", what: "Coverage of the terms mined from the job ad you are answering" },
  { name: "Impact", what: "Quantified results, ownership verbs, responsibility filler" },
  { name: "Contact", what: "Name, email, phone, location, profile link" }
];

export function ComingSoon() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Coming soon</p>

      <h1 className="mt-3 font-mono text-2xl font-medium tracking-tight sm:text-3xl">ats readability</h1>

      <p className="mt-4 max-w-measure text-sm leading-relaxed text-muted sm:text-base">
        Applicant tracking systems read a CV as text, not as a design. This will show you that text, score what
        survives, and list what to change — in order of how many points each fix is worth.
      </p>

      <section className="sheet mt-8 p-5 sm:p-6" aria-labelledby="checks-heading">
        <h2 id="checks-heading" className="text-sm font-semibold">
          What it checks
        </h2>

        <dl className="mt-4 space-y-3">
          {CHECKS.map((check) => (
            <div key={check.name} className="sm:flex sm:gap-4">
              <dt className="text-sm font-medium sm:w-40 sm:shrink-0">{check.name}</dt>
              <dd className="max-w-measure text-sm leading-relaxed text-muted">{check.what}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-8 max-w-measure text-sm leading-relaxed text-muted">
        The CV is read in your browser. Nothing is uploaded, and the server never sees the document.
      </p>

      <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
        No scoring model can predict an invitation. A high score means nothing stands between the CV and a human
        reader.
      </p>

      <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
        Questions:{" "}
        <a className="font-mono underline underline-offset-2 hover:text-ink" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </p>
    </main>
  );
}
