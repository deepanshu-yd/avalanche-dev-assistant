import express from "express";
import cors from "cors";
import { config } from "./config.js";
import routes from "./routes.js";

// Simple test server to verify Part 3 without OpenAI
const app = express();

app.use(express.json());
app.use(cors({ origin: config.corsOrigin }));

// Health endpoint
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Mock ask endpoint without OpenAI
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    // Load chunks without embeddings for demo
    const { readFileSync } = await import('fs');
    const chunksData = readFileSync('../data/chunks/chunks.jsonl', 'utf-8');
    const chunks = chunksData
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    // Simple keyword matching instead of semantic search
    const keywords = question.toLowerCase().split(' ');
    const matchedChunks = chunks
      .map(chunk => ({
        ...chunk,
        score: keywords.reduce((score, keyword) => {
          return score + (chunk.text.toLowerCase().includes(keyword) ? 1 : 0);
        }, 0)
      }))
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const sources = matchedChunks.map(chunk => ({
      title: chunk.title || 'Avalanche Documentation',
      url: chunk.url,
      section: chunk.section,
      similarity: chunk.score / keywords.length
    }));

    const context = matchedChunks.map(chunk => ({
      text: chunk.text,
      metadata: {
        id: chunk.id,
        url: chunk.url,
        title: chunk.title || 'Avalanche Documentation',
        section: chunk.section,
        tokens: chunk.tokens,
        similarity: chunk.score / keywords.length
      }
    }));

    res.json({
      answer: `Found ${matchedChunks.length} relevant documentation chunks using keyword matching (OpenAI embeddings will be added with API key). Question: "${question}"`,
      sources,
      context
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(config.port, () => {
  console.log(`[test server] listening on http://localhost:${config.port}`);
});
