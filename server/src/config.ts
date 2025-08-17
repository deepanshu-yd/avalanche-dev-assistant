import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  llmProvider: (process.env.LLM_PROVIDER || "gemini") as "openai" | "anthropic" | "gemini",
  openaiKey: process.env.OPENAI_API_KEY || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  geminiKey: process.env.GEMINI_API_KEY || ""
};

/**
 * TODO (you):
 * 1) Copy server/.env.example to server/.env (if not done already)
 * 2) Add your actual API keys:
 *    OPENAI_API_KEY=sk-...
 *    ANTHROPIC_API_KEY=sk-ant-...
 *    GEMINI_API_KEY=your-gemini-key...
 * 3) Choose your preferred LLM_PROVIDER (openai, anthropic, or gemini)
 */