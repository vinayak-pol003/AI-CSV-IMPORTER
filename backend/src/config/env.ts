import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",

  aiProvider: (process.env.AI_PROVIDER ?? "gemini") as "gemini" | "openrouter" | "groq" | "huggingface" | "cerebras",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openrouterModel: process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-001",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY ?? "",
  huggingfaceModel: process.env.HUGGINGFACE_MODEL ?? "zai-org/GLM-5.2:novita",
  cerebrasApiKey: process.env.CEREBRAS_API_KEY ?? "",
  cerebrasModel: process.env.CEREBRAS_MODEL ?? "llama-3.3-70b",

  aiBatchSize: parseInt(process.env.AI_BATCH_SIZE ?? "50", 10),
  aiMaxRetries: parseInt(process.env.AI_MAX_RETRIES ?? "3", 10),
  aiRetryBaseDelayMs: parseInt(process.env.AI_RETRY_BASE_DELAY_MS ?? "1000", 10),

  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? "10", 10),

  mongodbUri: process.env.MONGODB_URI ?? "",
} as const;

export const isProduction = env.nodeEnv === "production";
