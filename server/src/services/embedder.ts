import OpenAI from "openai";
import { config } from "../config";

// TODO: Add your OpenAI API key to server/.env
// OPENAI_API_KEY=your_key_here

console.log("Config openaiKey:", config.openaiKey);
console.log("Checking OpenAI key validity...");

const openai = config.openaiKey &&
  config.openaiKey !== "your_openai_key_here" &&
  config.openaiKey !== "YOUR_OPENAI_KEY_HERE" &&
  config.openaiKey.startsWith("sk-")
  ? new OpenAI({ apiKey: config.openaiKey })
  : null;

console.log("OpenAI client initialized:", !!openai);

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

/**
 * Generate mock embedding - used when no OpenAI API key is available
 */
function generateMockEmbedding(text: string): number[] {
  // Simple deterministic hash-based mock embedding
  const embedding = new Array(1536).fill(0); // OpenAI embedding size

  // Create a simple hash from the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Generate pseudo-random values based on the hash
  for (let i = 0; i < embedding.length; i++) {
    const seed = hash + i;
    embedding[i] = (Math.sin(seed) * 10000) % 1;
  }

  // Normalize the embedding
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 * Falls back to mock embeddings if OpenAI API key is not available
 */
export async function embed(text: string): Promise<EmbeddingResult> {
  console.log("embed() called with text length:", text.length);
  console.log("openai client available:", !!openai);

  // If no OpenAI API key is available, use mock embedding
  if (!openai) {
    console.log("Using mock embedding (no OpenAI API key configured)");
    return {
      embedding: generateMockEmbedding(text),
      tokens: Math.ceil(text.length / 4) // Rough token estimation
    };
  }

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
    console.log("Falling back to mock embedding");
    return {
      embedding: generateMockEmbedding(text),
      tokens: Math.ceil(text.length / 4) // Rough token estimation
    };
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
