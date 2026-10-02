import { useTranslations } from "next-intl";

const DESIGNED_SKILLS: readonly string[] = ["Selenium", "Java", "REST Assured", "CI/CD"];

/**
 * The product's whole argument in one image: a designed CV is swept by the
 * parser and replaced, in place, by the flat text it actually yields. The
 * designed layer is clipped away behind the beam, so the two states are never
 * side by side — you watch one become the other.
 */
export function ParseSweep() {
  const t = useTranslations("parseSweep");

  return (
    <figure className="bench relative overflow-hidden" aria-labelledby="sweep-caption">
      <div className="relative h-[18rem] sm:h-[19rem]">
        {/* What the parser yields. Sits underneath, revealed as the beam passes. */}
        <div className="absolute inset-0 overflow-hidden bg-bench-sunk px-5 py-5 sm:px-6">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-[1.75] text-muted sm:text-xs">
            {t("sample.extracted")}
          </pre>
        </div>

        {/* The document as its author designed it. */}
        <div className="absolute inset-0 bg-bench px-5 py-5 sm:px-6">
          <div className="flex gap-4">
            <div className="h-11 w-11 shrink-0 rounded-full bg-bench-sunk" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-tight">{t("sample.name")}</p>
              <p className="text-[11px] text-muted">{t("sample.role")}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_5.5rem] gap-5">
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-action">{t("sample.experience")}</p>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-line" />
                <div className="h-1.5 w-[92%] rounded-full bg-line" />
                <div className="h-1.5 w-[74%] rounded-full bg-line" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-1.5 w-[88%] rounded-full bg-line" />
                <div className="h-1.5 w-full rounded-full bg-line" />
                <div className="h-1.5 w-[60%] rounded-full bg-line" />
              </div>
            </div>

            <div className="space-y-2 border-l border-line pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-action">{t("sample.skills")}</p>
              {DESIGNED_SKILLS.map((skill) => (
                <p key={skill} className="truncate text-[10px] text-muted">
                  {skill}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-action">{t("sample.education")}</p>
            <div className="mt-2.5 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-line" />
              <div className="h-1.5 w-[80%] rounded-full bg-line" />
              <div className="h-1.5 w-[64%] rounded-full bg-line" />
            </div>
          </div>
        </div>

        {/* The read head. */}
        <div aria-hidden className="absolute inset-x-0 h-px bg-action">
          <div className="absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent to-action/12" />
        </div>
      </div>

      <figcaption
        id="sweep-caption"
        className="flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-xs text-muted sm:px-6"
      >
        <span>{t("caption")}</span>
        <span className="readout">{t("fileReadout")}</span>
      </figcaption>
    </figure>
  );
}
