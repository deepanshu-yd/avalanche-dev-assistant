import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  llmProvider: (process.env.LLM_PROVIDER || "anthropic") as "anthropic" | "openai",
  openaiKey: process.env.OPENAI_API_KEY || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || ""
};

/**
 * TODO (you):
 * 1) Copy server/.env.example to server/.env
 * 2) Set PORT if you need a different port.
 * 3) LLM_PROVIDER will matter in Part 3. Leave as-is for now.
 * 4) Add your API keys later in Part 3 when LLM integration is added.
 */
