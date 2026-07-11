import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { connectDatabase } from "./config/db";

async function main() {
  await connectDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`GrowEasy CSV Importer backend listening on port ${env.port}`, {
      env: env.nodeEnv,
      frontendOrigin: env.frontendOrigin,
    });
  });
}

main();
