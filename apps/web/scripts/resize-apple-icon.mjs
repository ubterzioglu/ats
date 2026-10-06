import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const input = resolve(__dirname, "../../../logo/icons/affa-icon-square-tight.png");
const output = resolve(__dirname, "../app/apple-icon.png");

await sharp(input)
  .resize(180, 180)
  .png()
  .toFile(output);

console.log("Created apple-icon.png (180x180)");
