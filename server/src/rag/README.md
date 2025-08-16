# RAG Prep Pipeline (Part 2)

This folder contains CLI scripts to fetch/prepare Avalanche documentation for embeddings.

## Flow
1. **Ingest**
   - Fetch from web (same-origin limited) using `seeds.json`:
     ```bash
     npm run ingest:fetch -w server
     ```
     or copy **local** docs:
     ```bash
     npm run ingest:local -w server -- --input=../../my-docs
     ```
   - Output: `data/raw/*.md|.txt` + `data/raw/manifest.json`

2. **Clean**
   ```bash
   npm run cleanDocs
   ```

3. **Chunk**
   ```bash
   npm run chunk
   ```
   - Output: `data/chunks/chunks.jsonl` (one JSON per line)

Embeddings + vector index will be added in Part 3.

## Configuration

- Edit `seeds.json` to specify starting URLs.
- Edit `docs.config.ts` for allowed domains and limits.
- Adjust `.env` values:
  ```
  DOCS_MAX_PAGES=150
  DOCS_MAX_DEPTH=2
  DOCS_CONCURRENCY=3
  ```

## Notes

- Respect websites' robots.txt and rate limits.
- This is a hackathon-friendly pipeline (fast & simple).
- If you have an exported docs folder, prefer `--mode=local` for stability.
