import fs from "fs";
import path from "path";
import axios from "axios";
import pLimit from "p-limit";
import normalizeUrl from "normalize-url";
import { URL } from "url";
import { htmlToReadableMarkdown } from "./htmlToText";
import { ensureDirs, RAW_DIR, cfg, allowedDomains } from "./docs.config";
import seedsJson from "./seeds.json";

type Mode = "fetch" | "local";

interface Args {
  mode: Mode;
  input?: string;
  out?: string;
}

function parseArgs(): Args {
  const args: Args = { mode: "fetch" };
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.split("=");
    if (k === "--mode") args.mode = v as Mode;
    if (k.startsWith("--input")) args.input = v;
    if (k.startsWith("--out")) args.out = v;
  }
  if (!args.mode) throw new Error("--mode=fetch|local is required");
  return args;
}

function isAllowed(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    return allowedDomains.includes(u.hostname);
  } catch {
    return false;
  }
}

async function fetchPage(url: string): Promise<{ ok: boolean; content?: string; status?: number }> {
  try {
    const res = await axios.get(url, { timeout: 20000 });
    return { ok: true, content: res.data };
  } catch (e: any) {
    return { ok: false, status: e?.response?.status };
  }
}

function saveFile(outDir: string, url: string, content: string) {
  const safeName = url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9/_-]+/gi, "_")
    .replace(/\/+$/, "");
  const filePath = path.join(outDir, `${safeName || "index"}.md`);
  const header = `<!-- source: ${url} -->\n\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, header + content, "utf8");
  return filePath;
}

async function crawlFetch(outDir: string) {
  ensureDirs();
  fs.mkdirSync(outDir, { recursive: true });

  const seeds: string[] = (seedsJson as any).seeds || [];
  if (!seeds.length) throw new Error("seeds.json has no seeds");

  const limit = pLimit(cfg.concurrency);
  const seen = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [];

  for (const s of seeds) {
    const u = normalizeUrl(s);
    if (!isAllowed(u)) continue;
    queue.push({ url: u, depth: 0 });
    seen.add(u);
  }

  let processed = 0;
  const manifest: Array<{ url: string; file: string }> = [];

  while (queue.length && processed < cfg.maxPages) {
    const batch = queue.splice(0, cfg.concurrency);
    await Promise.all(
      batch.map(({ url, depth }) =>
        limit(async () => {
          const res = await fetchPage(url);
          if (!res.ok || !res.content) return;

          const md = htmlToReadableMarkdown(res.content);
          const file = saveFile(outDir, url, md);
          manifest.push({ url, file });
          processed++;

          if (depth < cfg.maxDepth) {
            // naive link discovery
            const links = Array.from(res.content.matchAll(/href="([^"#]+)"/g)).map((m) => m[1]);
            for (const href of links) {
              let next: string;
              try {
                const abs = new URL(href, url).toString();
                next = normalizeUrl(abs);
              } catch {
                continue;
              }
              if (!isAllowed(next)) continue;
              if (seen.has(next)) continue;
              seen.add(next);
              if (processed + queue.length >= cfg.maxPages) break;
              queue.push({ url: next, depth: depth + 1 });
            }
          }
        })
      )
    );
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ processed, manifest }, null, 2));
  console.log(`[ingest] fetched pages: ${processed}, out: ${outDir}`);
}

function copyLocal(inputDir: string, outDir: string) {
  ensureDirs();
  fs.mkdirSync(outDir, { recursive: true });

  const exts = [".md", ".markdown", ".html", ".htm", ".txt"];
  function walk(d: string) {
    for (const entry of fs.readdirSync(d)) {
      const p = path.join(d, entry);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else if (exts.includes(path.extname(p).toLowerCase())) {
        const raw = fs.readFileSync(p, "utf8");
        let content = raw;
        if (p.endsWith(".html") || p.endsWith(".htm")) {
          content = htmlToReadableMarkdown(raw);
        }
        const rel = path.relative(inputDir, p);
        const target = path.join(outDir, rel.replace(/\.(html?|markdown)$/i, ".md"));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content, "utf8");
      }
    }
  }
  walk(inputDir);
  console.log(`[ingest] copied from local ${inputDir} → ${outDir}`);
}

async function main() {
  const args = parseArgs();
  const outDir = path.resolve(args.out || RAW_DIR);

  if (args.mode === "fetch") {
    await crawlFetch(outDir);
  } else if (args.mode === "local") {
    if (!args.input) throw new Error("--input=PATH is required for local mode");
    const inDir = path.resolve(args.input);
    copyLocal(inDir, outDir);
  } else {
    throw new Error("unknown mode");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
