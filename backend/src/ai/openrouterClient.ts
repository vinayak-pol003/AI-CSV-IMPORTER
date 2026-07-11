import OpenAI from "openai";
import { env } from "../config/env";
import { AiProcessingError } from "../utils/errors";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.openrouterApiKey) {
    throw new AiProcessingError(
      "OPENROUTER_API_KEY is not configured on the server. Set it in backend/.env."
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: env.openrouterApiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return client;
}

/**
 * Sends a single system+user prompt to OpenRouter and returns the raw text response.
 * OpenRouter uses the OpenAI-compatible API format.
 */
export async function callOpenRouter(systemInstructions: string, userPrompt: string): Promise<string> {
  const openai = getClient();

  const result = await openai.chat.completions.create({
    model: env.openrouterModel,
    messages: [
      { role: "system", content: systemInstructions },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const text = result.choices[0]?.message?.content;
  if (!text) {
    throw new AiProcessingError("OpenRouter returned an empty response.");
  }
  return text;
}
