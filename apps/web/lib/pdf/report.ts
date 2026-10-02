import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import type { AnalysisResult, Finding } from "@/types/analysis";

import { PDF_MONO, PDF_SANS, registerPdfFonts, type PdfFontSources } from "./fonts";
import { renderPdfBlob, renderPdfBytes } from "./render";

/**
 * The analysis report as a PDF, rendered entirely on the client from an
 * AnalysisResult that never touched a server. Same discipline as the
 * templates will get: one column, real text, no glyphs outside the embedded
 * faces - a report the recipient can parse as cleanly as the CV it grades.
 */

const INK = "#111111";
const MUTED = "#555555";
const LINE = "#cccccc";

const PAGE_STYLE = { paddingVertical: 40, paddingHorizontal: 44, fontFamily: PDF_SANS, color: INK } as const;
const TITLE_STYLE = { fontSize: 15, fontWeight: 700, marginBottom: 2 } as const;
const META_STYLE = { fontSize: 9, color: MUTED, marginBottom: 14 } as const;
const TOTAL_STYLE = { fontSize: 30, fontWeight: 700 } as const;
const BAND_STYLE = { fontSize: 11, fontWeight: 700, color: MUTED, marginTop: 2 } as const;
const SECTION_STYLE = { fontSize: 11, fontWeight: 700, marginTop: 16, marginBottom: 6 } as const;
const BODY_STYLE = { fontSize: 10, marginBottom: 3 } as const;
const DIMENSION_STYLE = { fontSize: 10, marginBottom: 5 } as const;
const SUMMARY_STYLE = { fontSize: 9, color: MUTED } as const;
const FINDING_TITLE_STYLE = { fontSize: 10, fontWeight: 700, marginBottom: 1 } as const;
const FINDING_BODY_STYLE = { fontSize: 9, color: MUTED, marginBottom: 1 } as const;
const EVIDENCE_STYLE = { fontSize: 8, fontFamily: PDF_MONO, color: MUTED, marginBottom: 1 } as const;
const FINDING_BLOCK_STYLE = { marginBottom: 8 } as const;
const RULE_STYLE = { borderBottomWidth: 1, borderBottomColor: LINE, marginBottom: 6 } as const;

function line(content: string, style: typeof BODY_STYLE = BODY_STYLE): ReactElement {
  return createElement(Text, { style }, content);
}

function rule(): ReactElement {
  return createElement(View, { style: RULE_STYLE });
}

function dimensionRows(result: AnalysisResult): ReactElement[] {
  return result.dimensions.map((dimension) =>
    createElement(
      View,
      { key: dimension.id, style: DIMENSION_STYLE },
      createElement(Text, { style: BODY_STYLE }, `${dimension.label}: ${dimension.score}/${dimension.max}`),
      createElement(Text, { style: SUMMARY_STYLE }, dimension.summary)
    )
  );
}

function findingBlock(finding: Finding, index: number): ReactElement {
  const children: ReactElement[] = [
    createElement(
      Text,
      { key: "title", style: FINDING_TITLE_STYLE },
      `${index + 1}. ${finding.title} (+${finding.cost} recoverable, ${finding.severity})`
    ),
    createElement(Text, { key: "detail", style: FINDING_BODY_STYLE }, finding.detail),
    createElement(Text, { key: "fix", style: FINDING_BODY_STYLE }, `Fix: ${finding.fix}`)
  ];
  (finding.evidence ?? []).forEach((item, evidenceIndex) => {
    children.push(
      createElement(Text, { key: `evidence-${evidenceIndex}`, style: EVIDENCE_STYLE }, item)
    );
  });
  return createElement(View, { key: finding.id, style: FINDING_BLOCK_STYLE }, ...children);
}

function keywordRows(result: AnalysisResult): ReactElement[] {
  const { keywords } = result;
  if (keywords.source !== "job-description") {
    return [
      line(
        "No job description was supplied, so the keyword dimension is capped at 20 points."
      )
    ];
  }
  const rows: ReactElement[] = [
    line(`Coverage: ${Math.round(keywords.coverage * 100)}% of the weighted terms the ad is indexed by`)
  ];
  if (keywords.matched.length > 0) {
    rows.push(line(`Matched: ${keywords.matched.map((term) => term.term).join(", ")}`));
  }
  if (keywords.missing.length > 0) {
    rows.push(line(`Missing: ${keywords.missing.map((term) => term.term).join(", ")}`));
  }
  return rows;
}

export function reportDocument(result: AnalysisResult): ReactElement {
  const sections: ReactElement[] = [
    createElement(Text, { key: "title", style: TITLE_STYLE }, "CV readability report"),
    createElement(Text, { key: "meta", style: META_STYLE }, `Generated ${result.generatedAt} in the browser; the CV never left this device.`),
    rule(),
    createElement(Text, { key: "total", style: TOTAL_STYLE }, `${result.total}/100`),
    createElement(Text, { key: "band", style: BAND_STYLE }, `${result.band.toUpperCase()} - ${result.bandLabel}`)
  ];

  sections.push(
    createElement(View, { key: "dimensions" },
      createElement(Text, { style: SECTION_STYLE }, "Dimensions"),
      ...dimensionRows(result)
    ),
    createElement(View, { key: "keywords" },
      createElement(Text, { style: SECTION_STYLE }, "Keywords"),
      ...keywordRows(result)
    ),
    createElement(View, { key: "findings" },
      createElement(Text, { style: SECTION_STYLE }, `The repair list (${result.findings.length})`),
      ...(result.findings.length > 0
        ? result.findings.map(findingBlock)
        : [line("Nothing to repair: the engine found no defect in this document.")])
    )
  );

  return createElement(
    Document,
    null,
    createElement(Page, { size: "A4", style: PAGE_STYLE }, ...sections)
  );
}

/**
 * The report as bytes (node-side callers, tests, CI). Font sources default to
 * the public/fonts URLs the browser fetches; node passes filesystem paths.
 */
export async function renderReportPdf(
  result: AnalysisResult,
  fontSources?: PdfFontSources
): Promise<Uint8Array> {
  registerPdfFonts(fontSources);
  return renderPdfBytes(reportDocument(result));
}

/**
 * The report as a Blob for the download button:
 * renderReportPdfBlob(result) - no font argument needed in the browser.
 */
export async function renderReportPdfBlob(
  result: AnalysisResult,
  fontSources?: PdfFontSources
): Promise<Blob> {
  registerPdfFonts(fontSources);
  return renderPdfBlob(reportDocument(result));
}
