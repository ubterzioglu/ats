import type { Finding } from "@/types/analysis";
import type { AtsProfile } from "./ats-detect";

/**
 * Produces vendor-specific informational findings when a known ATS platform is detected.
 * These findings carry cost: 0 so they provide actionable advisory without deducting points.
 */
export function atsAdviceFindings(profile: AtsProfile | null): readonly Finding[] {
  if (!profile) return [];

  return [
    {
      id: `structure.target-ats-${profile.id}`,
      dimension: "structure",
      severity: "low",
      title: `Target ATS detected: ${profile.name}`,
      detail: profile.notes,
      fix: profile.formatAdvice,
      cost: 0
    }
  ];
}
