import type { AnalysisResult } from "@/types/analysis";
import { LEGAL_VERSION } from "@/lib/legal-entity";

export type SubmitCvInput = {
  readonly file?: File;
  readonly cvText: string;
  readonly jobDescription?: string;
  readonly result: AnalysisResult;
};

export type SubmitCvOutcome =
  | { readonly ok: true; readonly id: string; readonly expiresAt: string }
  | { readonly ok: false; readonly reason: string };

export async function submitCv(input: SubmitCvInput): Promise<SubmitCvOutcome> {
  try {
    const formData = new FormData();
    
    if (input.file) {
      formData.append("file", input.file);
    }
    
    formData.append("cvText", input.cvText);
    if (input.jobDescription) {
      formData.append("jobDescription", input.jobDescription);
    }
    formData.append("result", JSON.stringify(input.result));
    formData.append("consent", "true");
    formData.append("consentVersion", LEGAL_VERSION);

    const response = await fetch("/api/cv", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "unknown" }));
      return { ok: false, reason: data.error ?? "submission-failed" };
    }

    const data = await response.json();
    if (!data.ok) {
      return { ok: false, reason: data.error ?? "submission-failed" };
    }

    return { ok: true, id: data.id, expiresAt: data.expiresAt };
  } catch (error) {
    console.error("[submit-cv] error", error);
    return { ok: false, reason: "network-error" };
  }
}
