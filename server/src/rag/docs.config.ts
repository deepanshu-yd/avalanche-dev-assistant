import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export const repoRoot = path.resolve(__dirname, "../../..");
export const RAW_DIR = path.join(repoRoot, "data/raw");
export const CHUNKS_DIR = path.join(repoRoot, "data/chunks");

// Allowed domains (same-origin guard)
export const allowedDomains = [
  "build.avax.network",
  "docs.avax.network"
];

/**
 * TODO (you):
 * - Review/modify allowedDomains if you want to include more sources.
 * - Be respectful of websites and their robots.txt.
 */

export const cfg = {
  maxPages: Number(process.env.DOCS_MAX_PAGES || 150),
  maxDepth: Number(process.env.DOCS_MAX_DEPTH || 2),
  concurrency: Number(process.env.DOCS_CONCURRENCY || 3)
};

// Ensure directories exist
export function ensureDirs() {
  for (const d of [RAW_DIR, CHUNKS_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}
