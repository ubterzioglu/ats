import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * One render pipeline for every PDF this app writes. pdf().toBlob() is the
 * only entry point @react-pdf/renderer implements identically in its browser
 * and node builds - renderToBuffer throws an environment error in the browser
 * - so everything goes through it and hands back bytes or a Blob.
 */

type PdfDocumentElement = Parameters<typeof pdf>[0];

export async function renderPdfBlob(element: ReactElement): Promise<Blob> {
  // The documents this app renders are always <Document> trees; the generic
  // ReactElement keeps the callers free of renderer prop types.
  return pdf(element as PdfDocumentElement).toBlob();
}

export async function renderPdfBytes(element: ReactElement): Promise<Uint8Array> {
  const blob = await renderPdfBlob(element);
  return new Uint8Array(await blob.arrayBuffer());
}
