import { Router } from "express";
import { z } from "zod";
import type { AskResponse, SearchResult } from "./types";
import { vectorStore } from "./services/vectorStore";
import { generateAnswer } from "./services/llmService";

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

    // Step 1: Search for relevant documentation chunks
    const searchResults = await vectorStore.searchDocs(question, 5);

    // Step 2: Generate LLM response using semantic search context
    const llmResponse = await generateAnswer(question, searchResults);

    // Step 3: Convert search results to sources format
    const sources = searchResults.map((result: SearchResult) => ({
      url: result.chunk.url,
      title: result.chunk.title,
      section: result.chunk.section,
      similarity: Math.round(result.similarity * 1000) / 1000
    }));

    // Step 4: Prepare context chunks for response
    const context = searchResults.map((result: SearchResult) => ({
      text: result.chunk.text,
      metadata: {
        id: result.chunk.id,
        url: result.chunk.url,
        title: result.chunk.title,
        section: result.chunk.section,
        tokens: result.chunk.tokens,
        similarity: Math.round(result.similarity * 1000) / 1000
      }
    }));

    const response: AskResponse = {
      answer: llmResponse.answer,
      sources,
      context,
      provider: llmResponse.provider,
      tokensUsed: llmResponse.tokensUsed
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /ask route:', error);

    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes("Missing API key")) {
        return res.status(400).json({
          error: "Missing API key. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file"
        });
      }
      if (error.message.includes("API error")) {
        return res.status(503).json({
          error: "LLM service temporarily unavailable. Please try again."
        });
      }
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});export default router;
