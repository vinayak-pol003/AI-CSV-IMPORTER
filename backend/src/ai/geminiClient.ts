import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { AiProcessingError } from "../utils/errors";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!env.geminiApiKey) {
    throw new AiProcessingError(
      "GEMINI_API_KEY is not configured on the server. Set it in backend/.env."
    );
  }
  if (!client) {
    client = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return client;
}

/**
 * Sends a single system+user prompt to Gemini and returns the raw text response.
 * Kept provider-specific logic isolated here so aiMapper.ts stays provider-agnostic
 * and could be pointed at OpenAI/Claude by swapping this module.
 */
export async function callGemini(systemInstructions: string, userPrompt: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: systemInstructions,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  if (!text) {
    throw new AiProcessingError("Gemini returned an empty response.");
  }
  return text;
}
