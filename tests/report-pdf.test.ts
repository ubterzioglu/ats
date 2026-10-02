import { describe, expect, it } from "vitest";

import { extractPdf } from "@/lib/extract/pdf";
import { renderReportPdf, renderReportPdfBlob } from "@/lib/pdf/report";
import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";

// Side-effect import: headless pdfjs globals before the first extraction.
import "./helpers/pdfjs-node";
import { nodeFontSources } from "./helpers/pdf-fonts";
import { JOB_AD, STRONG_CV, WEAK_CV } from "./fixtures";

/**
 * E.1a: the analysis report renders to a real PDF on the client, and the
 * rendered report survives the same extract round trip the probe does -
 * what the report says must be what a parser reads back.
 */

const strong = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD });
const weak = analyzeCv({ cvText: WEAK_CV });

const bytes = await renderReportPdf(strong, nodeFontSources());
const extracted = await extractPdf(new File([bytes], "report.pdf", { type: "application/pdf" }));

describe("report PDF", () => {
  it("renders a real PDF", () => {
    expect(bytes.length).toBeGreaterThan(2000);
    const magic = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
    expect(magic).toBe("%PDF");
  });

  it("carries the score, the band and the dimension rows", () => {
    expect(extracted.text).toContain(`${strong.total}/100`);
    expect(extracted.text).toContain(strong.bandLabel);
    for (const dimension of strong.dimensions) {
      expect(extracted.text).toContain(`${dimension.label}: ${dimension.score}/${dimension.max}`);
    }
  });

  it("carries the repair list with costs", () => {
    for (const finding of strong.findings) {
      expect(extracted.text, `finding ${finding.id} missing`).toContain(finding.title);
      expect(extracted.text).toContain(`+${finding.cost} recoverable`);
    }
  });

  it("carries the keyword section", () => {
    expect(extracted.text).toContain("playwright");
    expect(extracted.text).toContain("Coverage:");
  });

  it("extracts clean - no replacement marks, no encoding findings", () => {
    expect(extracted.text).not.toContain("\uFFFD");
    const ids = scoreParseability(buildContext(extracted.text)).findings.map(
      (finding) => finding.id
    );
    expect(ids).not.toContain("parse.mojibake");
    expect(ids).not.toContain("parse.encoding");
  });

  it("renders the weak CV's findings too", async () => {
    const weakBytes = await renderReportPdf(weak, nodeFontSources());
    const weakText = await extractPdf(
      new File([weakBytes], "report-weak.pdf", { type: "application/pdf" })
    );
    expect(weakText.text).toContain(`${weak.total}/100`);
    expect(weakText.text).toContain("Responsibility phrasing instead of results");
  });

  it("exposes the Blob form the download button uses", async () => {
    const blob = await renderReportPdfBlob(strong, nodeFontSources());
    expect(blob.size).toBeGreaterThan(2000);
    expect(blob.type).toBe("application/pdf");
  });
});
