import fs from "fs";
import path from "path";
import { RAW_DIR, ensureDirs } from "./docs.config";
import { collapseWhitespace } from "./htmlToText";

function walkFiles(dir: string, exts = [".md", ".txt"]) {
  const files: string[] = [];
  (function walk(d: string) {
    for (const entry of fs.readdirSync(d)) {
      const p = path.join(d, entry);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (exts.includes(path.extname(p).toLowerCase())) files.push(p);
    }
  })(dir);
  return files;
}

function cleanOne(file: string) {
  const src = fs.readFileSync(file, "utf8");
  const cleaned = collapseWhitespace(src)
    // ensure blank line after headings
    .replace(/^(#{1,6}\s.*)$/gm, "$1\n");
  fs.writeFileSync(file, cleaned, "utf8");
}

function main() {
  ensureDirs();
  const files = walkFiles(RAW_DIR);
  for (const f of files) cleanOne(f);
  console.log(`[clean] cleaned ${files.length} files in ${RAW_DIR}`);
}

main();
