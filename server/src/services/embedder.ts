import OpenAI from "openai";
import { config } from "../config.js";

// TODO: Add your OpenAI API key to server/.env
// OPENAI_API_KEY=your_key_here

const openai = new OpenAI({
  apiKey: config.openaiKey || process.env.OPENAI_API_KEY
});

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 */
export async function embed(text: string): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // Truncate to avoid token limits
      encoding_format: "float"
    });

    const embedding = response.data[0].embedding;
    const tokens = response.usage.total_tokens;

    return {
      embedding,
      tokens
    };
  } catch (error: any) {
    console.error("Embedding error:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
