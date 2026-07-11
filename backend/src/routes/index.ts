import { Router } from "express";
import uploadRoutes from "./uploadRoutes";
import processRoutes from "./processRoutes";
import statusRoutes from "./statusRoutes";
import scanRoutes from "./scanRoutes";

const router = Router();

router.use("/upload", uploadRoutes);
router.use("/process", processRoutes);
router.use("/status", statusRoutes);
router.use("/scans", scanRoutes);

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

export default router;
