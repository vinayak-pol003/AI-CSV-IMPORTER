import OpenAI from "openai";
import { env } from "../config/env";
import { AiProcessingError } from "../utils/errors";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.huggingfaceApiKey) {
    throw new AiProcessingError(
      "HUGGINGFACE_API_KEY is not configured on the server. Set it in backend/.env."
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: env.huggingfaceApiKey,
      baseURL: "https://router.huggingface.co/v1",
    });
  }
  return client;
}

/**
 * Sends a single system+user prompt to HuggingFace Inference API and returns the raw text response.
 * Uses the OpenAI-compatible router endpoint.
 */
export async function callHuggingFace(systemInstructions: string, userPrompt: string): Promise<string> {
  const openai = getClient();

  const result = await openai.chat.completions.create({
    model: env.huggingfaceModel,
    messages: [
      { role: "system", content: systemInstructions },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });

  const text = result.choices[0]?.message?.content;
  if (!text) {
    throw new AiProcessingError("HuggingFace returned an empty response.");
  }
  return text;
}
