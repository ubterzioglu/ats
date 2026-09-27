export type ExtractionSource = "pdf" | "docx" | "text";

export interface ExtractionResult {
  readonly text: string;
  readonly pages: number;
  readonly source: ExtractionSource;
  readonly fileName: string;
  readonly warning?: string;
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
