"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { acquireModel } from "@/lib/ai/model";
import type { ModelTier } from "@/lib/ai/providers/types";
import { askAboutReport, type AskTurn } from "@/lib/ai/tasks/ask";
import type { AnalysisResult } from "@/types/analysis";

interface ReportChatProps {
  readonly tier: ModelTier;
  readonly result: AnalysisResult;
}

interface DisplayTurn extends AskTurn {
  readonly failed?: boolean;
}

/**
 * Ask things about the report; the model answers from the serialized report
 * only. Rendered only when a text-model tier is active.
 */
export function ReportChat({ tier, result }: ReportChatProps) {
  const t = useTranslations("reportChat");
  const [turns, setTurns] = useState<readonly DisplayTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
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

  return (
    <section className="bench overflow-hidden" aria-labelledby="report-chat-heading">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 id="report-chat-heading" className="text-base font-semibold">
          {t("heading")}
        </h2>
        <p className="mt-1 max-w-measure text-sm leading-relaxed text-muted">
          {t("lede")}
        </p>
      </div>

      {turns.length > 0 ? (
        <ol className="divide-y divide-line/70">
          {turns.map((turn, index) =>
            turn.failed ? (
              <li key={`turn-${index}`} className="px-5 py-3 text-sm text-mark sm:px-6">
                {t("noAnswer")}
              </li>
            ) : (
              <li key={`turn-${index}`} className="px-5 py-3 sm:px-6">
                <p className="font-mono text-xs uppercase tracking-wide text-muted">
                  {t(turn.role === "user" ? "roleUser" : "roleModel")}
                </p>
                <p className="mt-1 max-w-measure text-sm leading-relaxed">{turn.content}</p>
              </li>
            )
          )}
        </ol>
      ) : null}

      {error ? <p className="px-5 py-3 text-sm text-mark sm:px-6">{error}</p> : null}

      <form className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6" onSubmit={ask}>
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
  );
}
