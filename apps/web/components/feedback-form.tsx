"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/feedback-schema";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function FeedbackForm() {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorKey, setErrorKey] = useState<"generic" | "rateLimit" | "invalid">("generic");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("submitting");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message,
          email: email.trim() || undefined,
          locale,
          website
        })
      });

      if (!response.ok) {
        setErrorKey(response.status === 429 ? "rateLimit" : response.status === 400 ? "invalid" : "generic");
        setState("error");
        return;
      }

      setMessage("");
      setEmail("");
      setCategory("idea");
      setState("success");
    } catch {
      setErrorKey("generic");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-lg border border-good/20 bg-good/10 p-6 text-center">
        <p className="font-medium text-good">{t("success")}</p>
        <p className="mt-2 text-sm text-muted">{t("successDetails")}</p>
        <button type="button" onClick={() => setState("idle")} className="mt-4 text-sm text-iris hover:underline">
          {t("sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="feedback-category" className="mb-2 block text-sm font-medium text-ink">
          {t("categoryLabel")}
        </label>
        <select
          id="feedback-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
          className="w-full rounded border border-line bg-bed px-4 py-2 text-ink"
        >
          {FEEDBACK_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t(`category.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="feedback-message" className="mb-2 block text-sm font-medium text-ink">
          {t("messageLabel")}
        </label>
        <textarea
          id="feedback-message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("messagePlaceholder")}
          className="w-full resize-y rounded border border-line bg-bed px-4 py-2 text-ink"
        />
      </div>

      <div>
        <label htmlFor="feedback-email" className="mb-2 block text-sm font-medium text-ink">
          {t("emailLabel")}
        </label>
        <input
          id="feedback-email"
          type="email"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          className="w-full rounded border border-line bg-bed px-4 py-2 text-ink"
        />
        <p className="mt-2 text-xs text-muted">{t("emailHint")}</p>
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="feedback-website">Website</label>
        <input
          id="feedback-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {state === "error" ? (
        <div role="alert" className="rounded-lg border border-caution/20 bg-caution/10 p-4">
          <p className="text-sm text-caution">{t(`error.${errorKey}`)}</p>
        </div>
      ) : null}

      <button type="submit" disabled={state === "submitting"} className="btn w-full disabled:cursor-not-allowed disabled:opacity-50">
        {state === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
