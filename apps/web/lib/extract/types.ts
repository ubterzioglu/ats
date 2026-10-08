export type ExtractionSource = "pdf" | "docx" | "text";

export interface ExtractionResult {
  readonly text: string;
  readonly pages: number;
  readonly source: ExtractionSource;
  readonly fileName: string;
  readonly warning?: string;
  /** PDF only: each page's text layer, in page order, for the OCR offer. */
  readonly pageTexts?: readonly string[];
  /** PDF only: pages whose text layer is empty. */
  readonly emptyPages?: number;
  /** PDF only: URLs extracted from link annotations. */
  readonly links?: readonly string[];
  /** PDF only: blocks extracted with zero or tiny invisible font size. */
  readonly hiddenTextBlocks?: number;
}

export class UnsupportedFileError extends Error {
  constructor(fileName: string) {
    super(
      `${fileName} is not a format this tool can read. Use PDF, DOCX or plain text — and note that a format a parser cannot read is a problem in itself.`
    );
    this.name = "UnsupportedFileError";
  }
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
