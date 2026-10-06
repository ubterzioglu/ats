"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { saveProfile } from "./profile-actions";

interface ProfileFormProps {
  readonly profile: {
    resume: Record<string, unknown>;
    extras: Record<string, unknown>;
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations("account");
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  const basics = (profile.resume.basics as Record<string, unknown>) ?? {};

  function handleSubmit(formData: FormData) {
    const resume = {
      basics: {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        summary: formData.get("summary")
      }
    };

    startTransition(async () => {
      const outcome = await saveProfile({ resume });
      if (outcome.state === "saved") {
        setState("saved");
      } else {
        setState("error");
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm text-mist">
          {t("fieldName")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={(basics.name as string) ?? ""}
          className="field mt-1"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm text-mist">
          {t("fieldEmail")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={(basics.email as string) ?? ""}
          className="field mt-1"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm text-mist">
          {t("fieldPhone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={(basics.phone as string) ?? ""}
          className="field mt-1"
        />
      </div>
      <div>
        <label htmlFor="summary" className="block text-sm text-mist">
          {t("fieldSummary")}
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          defaultValue={(basics.summary as string) ?? ""}
          className="field mt-1"
        />
      </div>
      <button type="submit" className="btn" disabled={isPending}>
        {t("profileSave")}
      </button>
      {state === "saved" && <p className="text-sm text-lime">{t("profileSaved")}</p>}
      {state === "error" && <p className="text-sm text-caution">{t("profileError")}</p>}
    </form>
  );
}
