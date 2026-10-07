import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "public", "vendor", "tesseract");

const files = [
  {
    source: "node_modules/tesseract.js/dist/worker.min.js",
    name: "worker.min.js"
  },
  {
    source: "node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js",
    name: "tesseract-core-relaxedsimd-lstm.wasm.js"
  },
  {
    source: "node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js",
    name: "tesseract-core-simd-lstm.wasm.js"
  },
  {
    source: "node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js",
    name: "tesseract-core-lstm.wasm.js"
  },
  {
    source: "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz",
    name: "eng.traineddata.gz"
  },
  {
    source: "node_modules/@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz",
    name: "deu.traineddata.gz"
  },
  {
    source: "node_modules/@tesseract.js-data/tur/4.0.0_best_int/tur.traineddata.gz",
    name: "tur.traineddata.gz"
  }
];

const missing = files.filter((file) => !existsSync(join(root, file.source)));
if (missing.length > 0) {
  console.warn(
    `[copy-ocr-assets] ${missing.length} file(s) not found; skipping. Run npm install first.`
  );
  process.exit(0);
}

mkdirSync(target, { recursive: true });
for (const file of files) {
  copyFileSync(join(root, file.source), join(target, file.name));
}
console.log(`[copy-ocr-assets] copied ${files.length} files to public/vendor/tesseract`);
