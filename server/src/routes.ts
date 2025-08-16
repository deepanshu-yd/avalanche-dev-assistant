import { Router } from "express";
import { z } from "zod";
import type { AskResponse } from "./types";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const AskSchema = z.object({
  question: z.string().min(1, "question is required")
});

router.post("/ask", (req, res) => {
  const parsed = AskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { question } = parsed.data;

  const response: AskResponse = {
    answer: `MVP server running. You asked: "${question}". RAG + LLM will be added in Part 3.`,
    sources: []
  };

  res.json(response);
});

export default router;
