"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import { HELP_ENTRIES } from "@/lib/help/bank";
import { createKeywordAnswerer } from "@/lib/help/keyword-answerer";
import { STARTER_IDS } from "@/lib/help/starters";
import type { HelpAnswer } from "@/lib/help/types";
import { cx } from "@/lib/ui";

interface Turn {
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly href?: string;
}

const PANEL_ID = "help-panel";

export function HelpBubble() {
  const t = useTranslations("help");
  const faq = useTranslations("faq.items");
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<readonly Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLOListElement>(null);

  const resolve = useCallback(
    (key: string) => {
      if (key.startsWith("faq.items.")) {
        const subKey = key.slice("faq.items.".length) as Parameters<typeof faq>[0];
        try {
          return faq(`${subKey}.a` as "upload.a");
        } catch {
          return key;
        }
      }
      if (key.startsWith("help.")) {
        const subKey = key.slice("help.".length) as Parameters<typeof t>[0];
        try {
          return t(subKey);
        } catch {
          return key;
        }
      }
      return key;
    },
    [t, faq]
  );

  const answererRef = useRef<ReturnType<typeof createKeywordAnswerer> | null>(null);
  if (!answererRef.current) {
    answererRef.current = createKeywordAnswerer({ entries: HELP_ENTRIES, resolve });
  }

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [turns]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (trimmed.length === 0 || busy || !answererRef.current) return;

    setInput("");
    setBusy(true);
    setTurns((current) => [...current, { role: "user", content: trimmed }]);

    const answer: HelpAnswer = await answererRef.current.answer(trimmed);
    if (answer.kind === "text") {
      setTurns((current) => [
        ...current,
        { role: "assistant", content: answer.text, ...(answer.href ? { href: answer.href } : {}) }
      ]);
    } else {
      setTurns((current) => [
        ...current,
        { role: "assistant", content: t("unknown"), href: "/about" }
      ]);
    }
    setBusy(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function handleStarter(id: string) {
    const starterKey = `help.start.${id}` as const;
    const text = resolve(starterKey);
    void submitQuestion(text);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="btn-quiet min-h-11 min-w-11 rounded-full border-2 border-bone/10 bg-bench p-0"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={t("bubbleLabel")}
        onClick={() => setOpen((current) => !current)}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9v4" />
          <path d="M10 6.5v.01" />
        </svg>
      </button>

      {open ? (
        <div
          id={PANEL_ID}
          role="dialog"
          aria-label={t("panelTitle")}
          className="bench absolute bottom-14 right-0 w-80 max-w-[calc(100vw-2rem)] border-2 border-bone/10 bg-bench"
        >
          <div className="flex items-center justify-between border-b-2 border-bone/10 px-4 py-2">
            <h3 className="text-sm font-semibold text-ink">{t("panelTitle")}</h3>
            <button
              type="button"
              className="btn-quiet min-h-8 px-2 text-xs"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label={t("close")}
            >
              {t("close")}
            </button>
          </div>

          {turns.length === 0 ? (
            <div className="flex flex-col gap-1 px-4 py-3">
              {STARTER_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn-quiet justify-start px-2 py-1 text-left text-sm text-action"
                  onClick={() => handleStarter(id)}
                >
                  {resolve(`help.start.${id}`)}
                </button>
              ))}
            </div>
          ) : (
            <ol
              ref={logRef}
              role="log"
              aria-live="polite"
              className="max-h-64 divide-y divide-line overflow-y-auto px-4"
            >
              {turns.map((turn, index) => (
                <li key={index} className="py-2 text-sm">
                  <p className="condensed text-micro font-normal text-muted">
                    {turn.role === "user" ? t("inputLabel") : t("bubbleLabel")}
                  </p>
                  <p className="mt-0.5 text-ink">
                    {turn.content}
                    {turn.href ? (
                      <Link
                        href={turn.href}
                        className="ml-1 text-action underline"
                      >
                        {t("contactLink")}
                      </Link>
                    ) : null}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <form
            className="flex items-center gap-2 border-t-2 border-bone/10 px-4 py-2"
            onSubmit={handleSubmit}
          >
            <input
              ref={inputRef}
              type="text"
              className="field min-w-0 flex-1 py-2 text-sm"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("inputPlaceholder")}
              aria-label={t("inputLabel")}
              data-clarity-mask="true"
              disabled={busy}
            />
            <button
              type="submit"
              className="btn-quiet min-h-9 px-3 text-sm"
              disabled={input.trim().length === 0 || busy}
            >
              {t("send")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
