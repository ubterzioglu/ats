"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { acquireModel } from "@/lib/ai/model";
import type { ModelTier } from "@/lib/ai/providers/types";
import { askAboutReport, type AskTurn } from "@/lib/ai/tasks/ask";
import { cx } from "@/lib/ui";
import type { AnalysisResult } from "@/types/analysis";

interface AskDockProps {
  readonly tier: ModelTier;
  readonly result: AnalysisResult;
}

interface DisplayTurn extends AskTurn {
  readonly failed?: boolean;
}

/**
 * The dock. As a panel in the stack, the question box was somewhere the user
 * had to scroll back to, so a question that occurred to them halfway down the
 * work list cost a scroll in each direction. It is now pinned to the bottom of
 * the viewport and reachable from anywhere in the report.
 *
 * Collapsed it is one line. The conversation opens upward, over the work rather
 * than pushing it, because the question is about what is on screen.
 *
 * Rendered only when a text-model tier is active, so the deterministic product
 * is never shortened by a strip advertising something unavailable.
 */
export function AskDock({ tier, result }: AskDockProps) {
  const t = useTranslations("askDock");
  const [turns, setTurns] = useState<readonly DisplayTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (tier === "none") return null;

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (text.length === 0 || busy) return;

    const history: AskTurn[] = turns
      .filter((turn) => !turn.failed)
      .map((turn) => ({ role: turn.role, content: turn.content }));

    setQuestion("");
    setError(null);
    setBusy(true);
    setOpen(true);
    setTurns((current) => [...current, { role: "user", content: text }]);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const session = await acquireModel(tier);
      const answer = await askAboutReport(session.model, result, text, history, controller.signal);
      setTurns((current) => [...current, { role: "assistant", content: answer }]);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : t("failed"));
        setTurns((current) => [...current, { role: "assistant", content: "", failed: true }]);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
  }

  const hasConversation = turns.length > 0 || error !== null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="pointer-events-auto mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
        <section
          data-ask-dock
          className={cx("bench overflow-hidden border border-line", busy && "live-edge")}
          aria-label={t("heading")}
        >
          {open && hasConversation ? (
            <ol className="max-h-[40dvh] divide-y divide-line overflow-y-auto pr-16">
              {turns.map((turn, index) =>
                turn.failed ? (
                  <li key={`turn-${index}`} className="px-5 py-3 text-sm text-mark sm:px-6">
                    {t("noAnswer")}
                  </li>
                ) : (
                  <li key={`turn-${index}`} className="px-5 py-3 sm:px-6">
                    {/* The model's turn is named in live-ink; its answer stays
                        in ink, because a paragraph of cyan is unreadable and
                        the colour only has to say who wrote it. */}
                    <p
                      className={cx(
                        "condensed text-micro font-normal",
                        turn.role === "user" ? "text-muted" : "text-live-ink"
                      )}
                    >
                      {t(turn.role === "user" ? "roleUser" : "roleModel")}
                    </p>
                    <p className="mt-1 max-w-measure text-sm leading-relaxed">{turn.content}</p>
                  </li>
                )
              )}
              {error ? (
                <li className="px-5 py-3 text-sm text-mark sm:px-6">{error}</li>
              ) : null}
            </ol>
          ) : null}

          <form
            className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6"
            onSubmit={(event) => void ask(event)}
          >
            {hasConversation ? (
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center text-micro text-muted transition-colors hover:text-ink"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
              >
                {t(open ? "hide" : "show", { count: turns.length })}
              </button>
            ) : null}

            <input
              className="field min-w-0 flex-1 text-sm"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t(busy ? "waiting" : "placeholder")}
              disabled={busy}
              aria-label={t("inputLabel")}
            />

            {busy ? (
              <button type="button" className="btn-quiet" onClick={cancel}>
                {t("cancel")}
              </button>
            ) : (
              <button type="submit" className="btn" disabled={question.trim().length === 0}>
                {t("ask")}
              </button>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
