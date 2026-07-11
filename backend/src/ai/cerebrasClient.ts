import OpenAI from "openai";
import { env } from "../config/env";
import { AiProcessingError } from "../utils/errors";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.cerebrasApiKey) {
    throw new AiProcessingError(
      "CEREBRAS_API_KEY is not configured on the server. Set it in backend/.env."
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: env.cerebrasApiKey,
      baseURL: "https://api.cerebras.ai/v1",
    });
  }
  return client;
}

/**
 * Sends a single system+user prompt to Cerebras and returns the raw text response.
 * Cerebras uses the OpenAI-compatible API format with very fast inference.
 */
export async function callCerebras(systemInstructions: string, userPrompt: string): Promise<string> {
  const openai = getClient();

  const result = await openai.chat.completions.create({
    model: env.cerebrasModel,
    messages: [
      { role: "system", content: systemInstructions },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });

  const text = result.choices[0]?.message?.content;
  if (!text) {
    throw new AiProcessingError("Cerebras returned an empty response.");
  }
  return text;
}
