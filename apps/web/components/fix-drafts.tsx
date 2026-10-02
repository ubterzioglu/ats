import { applyFixDraft, draftFixes } from "@/lib/scoring/drafts";

interface FixDraftsProps {
  readonly text: string;
  readonly onApply: (newText: string) => void;
}

const MAX_SHOWN = 8;

/**
 * Mechanical rewrites of responsibility phrasing. Everything the candidate
 * still has to substantiate stays visible as [quantify: ...]; a draft never
 * adds a skill, tool or number the line did not contain.
 */
export function FixDrafts({ text, onApply }: FixDraftsProps) {
  const drafts = draftFixes(text);
  if (drafts.length === 0) return null;

  return (
    <section className="sheet overflow-hidden" aria-labelledby="drafts-heading">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 id="drafts-heading" className="text-base font-semibold">
          Rewrite drafts
        </h2>
        <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">
          Responsibility phrasing rewritten as a claim.{" "}
          <span className="font-mono text-xs">[quantify: …]</span> marks the part only you can
          fill in. Applying a draft re-runs the analysis so the score rail shows the difference.
        </p>
      </div>

      <ul className="divide-y divide-line/70">
        {drafts.slice(0, MAX_SHOWN).map((draft) => (
          <li key={`${draft.lineIndex}-${draft.rule}`} className="px-5 py-4 sm:px-6">
            <p className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-muted line-through decoration-mark/50">
              {draft.original}
            </p>
            <p className="mt-1.5 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-ink">
              {draft.replacement}
            </p>
            <button
              type="button"
              className="btn-quiet mt-3"
              onClick={() => {
                const next = applyFixDraft(text, draft);
                if (next) onApply(next);
              }}
            >
              Apply and re-score
            </button>
          </li>
        ))}
      </ul>

      {drafts.length > MAX_SHOWN ? (
        <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-6">
          {drafts.length - MAX_SHOWN} more drafts appear as you resolve these.
        </p>
      ) : null}
    </section>
  );
}
