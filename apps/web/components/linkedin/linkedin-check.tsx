"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { compareResumeToProfile, type ConsistencyReport } from "@/lib/linkedin/compare";
import { parseLinkedinDocument } from "@/lib/linkedin/parse";
import { importResumeFromDocument } from "@/lib/resume/import-document";

interface CheckResult {
  readonly report: ConsistencyReport;
  readonly warnings: readonly string[];
}

const ACCEPT = ".pdf,.docx,.txt,application/pdf,text/plain";

export function LinkedinCheck() {
  const t = useTranslations("features.linkedin");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cvFile === null || profileFile === null) {
      setError(t("needBoth"));
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const [imported, parsed] = await Promise.all([
        importResumeFromDocument(cvFile),
        parseLinkedinDocument(profileFile)
      ]);
      setResult({
        report: compareResumeToProfile(imported.resume, parsed.profile),
        warnings: parsed.warnings
      });
    } catch (cause) {
      setError(t("error", { message: cause instanceof Error ? cause.message : String(cause) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="linkedin-check-heading" className="mt-12 max-w-measure">
      <h2 id="linkedin-check-heading" className="text-heading-sm font-bold text-bone">
        {t("run")}
      </h2>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-5">
        <label className="block text-sm text-mist">
          <span className="mb-2 block font-semibold text-bone">{t("cvLabel")}</span>
          <input
            type="file"
            accept={ACCEPT}
            onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </label>
        <label className="block text-sm text-mist">
          <span className="mb-2 block font-semibold text-bone">{t("profileLabel")}</span>
          <input
            type="file"
            accept={ACCEPT}
            onChange={(event) => setProfileFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </label>
        <button type="submit" disabled={busy} className="btn">
          {busy ? t("running") : t("run")}
        </button>
        <p className="text-sm text-muted">{t("private")}</p>
      </form>

      <div aria-live="polite" className="mt-8">
        {error ? <p role="alert" className="text-caution">{error}</p> : null}
        {result ? <ResultView result={result} /> : null}
      </div>
    </section>
  );
}

function ResultView({ result }: { readonly result: CheckResult }) {
  const t = useTranslations("features.linkedin");
  const { report, warnings } = result;

  return (
    <div>
      <h3 className="text-lg font-bold text-bone">{t("resultTitle")}</h3>
      <p className="mt-2 text-sm text-mist">
        {t("summary", { roles: report.matchedRoles, skills: report.comparedSkills })}
      </p>

      {report.inconsistencies.length === 0 ? (
        <p className="mt-4 text-mist">{t("none")}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {report.inconsistencies.map((item) => (
            <li key={item.id} className="rounded-2xl border-2 border-bone/15 p-4">
              <p className="text-bone">{item.detail}</p>
              <dl className="mt-3 space-y-1 text-sm text-mist">
                <div>
                  <dt className="inline font-semibold text-bone">{t("cvSide")}: </dt>
                  <dd className="inline">{item.cvEvidence}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-bone">{t("profileSide")}: </dt>
                  <dd className="inline">{item.profileEvidence}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 ? (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-bone">{t("warningsTitle")}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
