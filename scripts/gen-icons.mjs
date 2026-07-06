import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(path.join(dir, "icon-source.svg"));
const outDir = path.join(dir, "..", "public", "icons");

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-192.png", size: 192, maskable: true },
  { name: "maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size, maskable } of sizes) {
  let img = sharp(svg).resize(size, size);
  if (maskable) {
    // Add safe-zone padding (bg fills full canvas, art scaled down ~80%) for maskable icons
    const inner = Math.round(size * 0.8);
    const padded = await sharp(svg)
      .resize(inner, inner)
      .extend({
        top: Math.round((size - inner) / 2),
        bottom: Math.round((size - inner) / 2),
        left: Math.round((size - inner) / 2),
        right: Math.round((size - inner) / 2),
        background: "#14151f",
      })
      .png()
      .toBuffer();
    await sharp(padded).toFile(path.join(outDir, name));
  } else {
    await img.png().toFile(path.join(outDir, name));
  }
}

console.log("Icons generated in", outDir);
