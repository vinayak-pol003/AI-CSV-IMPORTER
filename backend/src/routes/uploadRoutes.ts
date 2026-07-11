import { Router } from "express";
import { uploadCsv } from "../middleware/upload";
import { uploadCsvHandler } from "../controllers/uploadController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/",
  (req, res, next) => {
    uploadCsv(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  uploadCsvHandler
);

export default router;
