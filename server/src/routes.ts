import { Router } from "express";
import { z } from "zod";
import type { AskResponse } from "./types";
import { vectorStore } from "./services/vectorStore.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const AskSchema = z.object({
  question: z.string().min(1, "question is required")
});

router.post("/ask", async (req, res) => {
  try {
    const parsed = AskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { question } = parsed.data;

    // Search for relevant documentation chunks
    const searchResults = await vectorStore.searchDocs(question, 5);

    // Convert search results to sources format
    const sources = searchResults.map(result => ({
      url: result.chunk.url,
      title: result.chunk.title,
      section: result.chunk.section,
      similarity: result.similarity
    }));

    const response: AskResponse = {
      answer: `Found ${searchResults.length} relevant documentation chunks for: "${question}". LLM integration will be added in Part 4.`,
      sources,
      context: searchResults.map(result => ({
        text: result.chunk.text,
        metadata: {
          id: result.chunk.id,
          url: result.chunk.url,
          title: result.chunk.title,
          section: result.chunk.section,
          tokens: result.chunk.tokens,
          similarity: result.similarity
        }
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /ask route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
