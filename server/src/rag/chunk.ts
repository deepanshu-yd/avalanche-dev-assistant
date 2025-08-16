import fs from "fs";
import path from "path";
import { RAW_DIR, CHUNKS_DIR, ensureDirs } from "./docs.config";
import { hashStable } from "./hash";

interface Chunk {
  id: string;
  url?: string;
  title: string;
  section?: string;
  tokens: number;
  text: string;
}

function* headingSplit(content: string): Generator<{ heading: string; body: string }> {
  const parts = content.split(/^#{1,3}\s.*$/gm);
  const heads = (content.match(/^#{1,3}\s.*$/gm) || []).map((h) => h.trim());
  if (!heads.length) {
    yield { heading: "", body: content };
    return;
  }
  for (let i = 0; i < parts.length; i++) {
    const body = parts[i].trim();
    const heading = i === 0 ? (heads[0] || "") : (heads[i - 1] || "");
    if (body) yield { heading, body };
  }
}

function splitWithOverlap(text: string, size = 1200, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(text.slice(i, end));
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

function extractUrlFromHeader(s: string): string | undefined {
  const m = s.match(/<!--\s*source:\s*(.*?)\s*-->/i);
  return m?.[1]?.trim();
}

function titleFromContent(content: string): string {
  const m = content.match(/^#\s+(.*)$/m);
  return (m?.[1] || "Untitled").trim();
}

function sectionFromHeading(h: string): string | undefined {
  const m = h.match(/^#{2,3}\s+(.*)$/);
  return m?.[1]?.trim();
}

function approxTokens(s: string): number {
  // Rough proxy: words count
  return (s.match(/\S+/g) || []).length;
}

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

function main() {
  ensureDirs();
  const outFile = path.join(CHUNKS_DIR, "chunks.jsonl");
  const files = walkFiles(RAW_DIR);
  const out = fs.createWriteStream(outFile, "utf8");

  let totalChunks = 0;

  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    const url = extractUrlFromHeader(raw);
    const title = titleFromContent(raw);
    for (const part of headingSplit(raw)) {
      const body = part.body;
      if (body.length <= 2000) {
        const chunk: Chunk = {
          id: hashStable(`${f}:${part.heading || "root"}`),
          url,
          title,
          section: sectionFromHeading(part.heading),
          tokens: approxTokens(body),
          text: body
        };
        out.write(JSON.stringify(chunk) + "\n");
        totalChunks++;
      } else {
        const pieces = splitWithOverlap(body, 1200, 200);
        let idx = 0;
        for (const piece of pieces) {
          const chunk: Chunk = {
            id: hashStable(`${f}:${part.heading || "root"}:${idx++}`),
            url,
            title,
            section: sectionFromHeading(part.heading),
            tokens: approxTokens(piece),
            text: piece
          };
          out.write(JSON.stringify(chunk) + "\n");
          totalChunks++;
        }
      }
    }
  }

  out.end();
  console.log(`[chunk] wrote ${totalChunks} chunks → ${outFile}`);
}

main();
