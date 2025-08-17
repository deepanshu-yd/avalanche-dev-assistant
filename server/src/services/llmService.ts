import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { SearchResult } from '../types.js';

// Provider configuration
const PROVIDER = config.llmProvider;

// Initialize clients
const openai = config.openaiKey ? new OpenAI({ apiKey: config.openaiKey }) : null;
const anthropic = config.anthropicKey ? new Anthropic({ apiKey: config.anthropicKey }) : null;

interface LLMResponse {
  answer: string;
  tokensUsed?: number;
  provider: string;
}

export async function generateAnswer(query: string, searchResults: SearchResult[]): Promise<LLMResponse> {
  // Check if we have any API keys
  if (!config.openaiKey && !config.anthropicKey) {
    throw new Error("Missing API key. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file");
  }

  // Check if no relevant docs found
  if (!searchResults.length) {
    return {
      answer: "No relevant documentation found. Please refine your question or try asking about Avalanche smart contracts, subnets, or development tools.",
      provider: PROVIDER
    };
  }

  // Build context from search results (top 3 chunks)
  const context = searchResults
    .slice(0, 3)
    .map((result, index) =>
      `[Document ${index + 1}${result.chunk.section ? ` - ${result.chunk.section}` : ''}]:\n${result.chunk.text}`
    )
    .join('\n\n---\n\n');

  // Build the prompt
  const systemPrompt = `You are an expert Avalanche blockchain developer assistant. You help developers build applications on the Avalanche platform.

Your role is to:
- Answer questions clearly and concisely for developers
- Provide practical, actionable guidance
- Reference specific documentation when relevant
- Focus on Avalanche-specific features and best practices

Always answer based on the provided documentation context. If the context doesn't contain enough information, say so and suggest where to look for more details.`;

  const userPrompt = `User question: ${query}

Relevant Avalanche documentation:
${context}

Please provide a clear, developer-focused answer based on the documentation above.`;

  // Generate response based on provider
  if (PROVIDER === "anthropic" && anthropic) {
    return await generateAnthropicResponse(systemPrompt, userPrompt);
  } else if (PROVIDER === "openai" && openai) {
    return await generateOpenAIResponse(systemPrompt, userPrompt);
  } else {
    // Fallback to available provider
    if (openai) {
      return await generateOpenAIResponse(systemPrompt, userPrompt);
    } else if (anthropic) {
      return await generateAnthropicResponse(systemPrompt, userPrompt);
    } else {
      throw new Error(`No valid API key found for provider: ${PROVIDER}`);
    }
  }
}

async function generateOpenAIResponse(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
  if (!openai) {
    throw new Error("OpenAI client not initialized. Check your OPENAI_API_KEY in .env");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview", // GPT-4 Turbo (gpt-4.1-mini equivalent)
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.1 // Low temperature for consistent, factual responses
    });

    const answer = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
    const tokensUsed = response.usage?.total_tokens;

    return {
      answer,
      tokensUsed,
      provider: "openai"
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

async function generateAnthropicResponse(systemPrompt: string, userPrompt: string): Promise<LLMResponse> {
  if (!anthropic) {
    throw new Error("Anthropic client not initialized. Check your ANTHROPIC_API_KEY in .env");
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Claude 3.5 Sonnet
      max_tokens: 1000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    });

    const answer = response.content[0]?.type === 'text'
      ? response.content[0].text
      : "I apologize, but I couldn't generate a response.";

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    return {
      answer,
      tokensUsed,
      provider: "anthropic"
    };
  } catch (error: any) {
    console.error("Anthropic API error:", error);
    throw new Error(`Anthropic API error: ${error.message}`);
  }
}
