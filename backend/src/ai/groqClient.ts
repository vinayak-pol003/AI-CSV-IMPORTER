import OpenAI from "openai";
import { env } from "../config/env";
import { AiProcessingError } from "../utils/errors";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.groqApiKey) {
    throw new AiProcessingError(
      "GROQ_API_KEY is not configured on the server. Set it in backend/.env."
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: env.groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}

/**
 * Sends a single system+user prompt to Groq and returns the raw text response.
 * Groq uses the OpenAI-compatible API format with very fast inference.
 */
export async function callGroq(systemInstructions: string, userPrompt: string): Promise<string> {
  const openai = getClient();

  const result = await openai.chat.completions.create({
    model: env.groqModel,
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
    throw new AiProcessingError("Groq returned an empty response.");
  }
  return text;
}
