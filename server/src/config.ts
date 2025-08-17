import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  llmProvider: (process.env.LLM_PROVIDER || "openai") as "openai" | "anthropic",
  openaiKey: process.env.OPENAI_API_KEY || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || ""
};

/**
 * TODO (you):
 * 1) Copy server/.env.example to server/.env (if not done already)
 * 2) Add your actual API keys:
 *    OPENAI_API_KEY=sk-...
 *    ANTHROPIC_API_KEY=sk-ant-...
 * 3) Choose your preferred LLM_PROVIDER (openai or anthropic)
 */
