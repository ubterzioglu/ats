import { join } from "node:path";

import type { PdfFontSources } from "@/lib/pdf/fonts";

/**
 * Node-side twin of WEB_FONT_SOURCES: the same files the browser fetches from
 * /fonts, resolved from the workspace's public/ directory. Tests render PDFs
 * headless, where a root-relative URL would mean nothing to fontkit.
 */
export function nodeFontSources(): PdfFontSources {
  const dir = join(process.cwd(), "public", "fonts");
  return {
    sans: [
      { src: join(dir, "dejavu-sans.ttf"), fontWeight: 400 },
      { src: join(dir, "dejavu-sans-bold.ttf"), fontWeight: 700 }
    ],
    mono: [{ src: join(dir, "dejavu-sans-mono.ttf"), fontWeight: 400 }]
  };
}
