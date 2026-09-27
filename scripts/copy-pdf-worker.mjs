import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.mjs"
];

const target = join(root, "public", "vendor", "pdf.worker.min.mjs");
const source = candidates.map((c) => join(root, c)).find((p) => existsSync(p));

if (!source) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found; skipping.");
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("[copy-pdf-worker] copied worker to public/vendor/pdf.worker.min.mjs");
