import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve("dist-offline");
const srcHtml = resolve(distDir, "index.html");
const targetHtml = resolve(distDir, "aphelion-offline.html");
const checksumFile = resolve(distDir, "aphelion-offline.html.sha256.txt");

if (!existsSync(srcHtml)) {
  throw new Error(`Expected single-file output at ${srcHtml}`);
}

renameSync(srcHtml, targetHtml);
const bytes = readFileSync(targetHtml);
const hash = createHash("sha256").update(bytes).digest("hex");
writeFileSync(checksumFile, `${hash}  aphelion-offline.html\n`, "utf8");

console.log(`Generated ${targetHtml} (${(bytes.length / 1024).toFixed(1)} KB)`);
console.log(`SHA-256: ${hash}`);
