import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const jobId = uuidv4();
    const ext = path.extname(file.originalname) || ".csv";
    cb(null, `${jobId}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const isCsv =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/csv" ||
    file.originalname.toLowerCase().endsWith(".csv");

  if (!isCsv) {
    cb(new AppError("Only .csv files are accepted.", 400));
    return;
  }
  cb(null, true);
}

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
  },
}).single("file");

export { UPLOAD_DIR };
