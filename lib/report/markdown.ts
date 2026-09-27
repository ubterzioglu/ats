import type { AnalysisResult } from "@/types/analysis";

function bar(score: number, max: number): string {
  const filled = Math.round((score / max) * 10);
  return `${"#".repeat(filled)}${".".repeat(10 - filled)}`;
}

/** A plain-text report the user can keep, diff or paste into a ticket. */
export function buildMarkdownReport(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push(`# ATS readiness report`);
  lines.push("");
  lines.push(`**${result.total}/100 — ${result.bandLabel}**`);
  lines.push("");
  lines.push(
    `Language: ${result.language.toUpperCase()} · ${result.stats.words} words · ~${result.stats.estimatedPages} page(s) · generated ${result.generatedAt.slice(0, 10)}`
  );
  lines.push("");

  lines.push("## Dimensions");
  lines.push("");
  for (const dimension of result.dimensions) {
    lines.push(
      `- \`${bar(dimension.score, dimension.max)}\` **${dimension.label}** ${dimension.score}/${dimension.max} — ${dimension.summary}`
    );
  }
  lines.push("");

  lines.push("## Fix list");
  lines.push("");
  if (result.findings.length === 0) {
    lines.push("No issues found.");
  } else {
    result.findings.forEach((finding, index) => {
      lines.push(`### ${index + 1}. ${finding.title} (−${finding.cost} pts, ${finding.severity})`);
      lines.push("");
      lines.push(finding.detail);
      lines.push("");
      lines.push(`**Fix:** ${finding.fix}`);
      if (finding.evidence && finding.evidence.length > 0) {
        lines.push("");
        lines.push("```");
        lines.push(...finding.evidence);
        lines.push("```");
      }
      lines.push("");
    });
  }

  lines.push("## Keywords");
  lines.push("");
  if (result.keywords.source === "job-description") {
    lines.push(`Coverage against the job ad: ${Math.round(result.keywords.coverage * 100)}%`);
    lines.push("");
    lines.push(`**Matched:** ${result.keywords.matched.map((term) => term.term).join(", ") || "none"}`);
    lines.push("");
    lines.push(`**Missing:** ${result.keywords.missing.map((term) => term.term).join(", ") || "none"}`);
  } else {
    lines.push("No job ad supplied — the list below is the skill inventory found in the CV.");
    lines.push("");
    lines.push(result.keywords.matched.map((term) => term.term).join(", ") || "none");
  }
  lines.push("");

  if (result.sections.length > 0) {
    lines.push("## Sections detected");
    lines.push("");
    lines.push(result.sections.map((section) => section.label).join(" · "));
    lines.push("");
  }

  return lines.join("\n");
}
