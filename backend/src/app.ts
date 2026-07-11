import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { env } from "./config/env";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Root-level health check (per assignment spec: GET /health)
  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
