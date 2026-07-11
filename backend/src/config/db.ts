import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  if (!env.mongodbUri) {
    logger.warn("MONGODB_URI is not set. Skipping database connection.");
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error("Failed to connect to MongoDB", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}
