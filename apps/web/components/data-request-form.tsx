"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function DataRequestForm() {
  const t = useTranslations("dataRequest");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"access" | "rectification" | "erasure" | "other">("access");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type, description })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit request");
      }

      setStatus("success");
      setEmail("");
      setDescription("");
      setType("access");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit request");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-good/10 border border-good/20 rounded-lg p-6 text-center">
        <p className="text-good font-medium">{t("success")}</p>
        <p className="text-muted text-sm mt-2">{t("successDetails")}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-iris hover:underline text-sm"
        >
          {t("submitAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-bed border border-line rounded px-4 py-2 text-ink"
          placeholder={t("emailPlaceholder")}
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-ink mb-2">
          {t("typeLabel")}
        </label>
        <select
          id="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full bg-bed border border-line rounded px-4 py-2 text-ink"
        >
          <option value="access">{t("typeAccess")}</option>
          <option value="rectification">{t("typeRectification")}</option>
          <option value="erasure">{t("typeErasure")}</option>
          <option value="other">{t("typeOther")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
          {t("descriptionLabel")}
        </label>
        <textarea
          id="description"
          required
          minLength={10}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full bg-bed border border-line rounded px-4 py-2 text-ink resize-y"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      {status === "error" && (
        <div className="bg-caution/10 border border-caution/20 rounded-lg p-4">
          <p className="text-caution text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full btn disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
