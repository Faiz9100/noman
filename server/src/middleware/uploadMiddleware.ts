import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { env } from "../config/env";
import { ApiError } from "./errorMiddleware";

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|webp/;
  const isValidExt = allowed.test(path.extname(file.originalname).toLowerCase());
  const isValidMime = allowed.test(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only .jpeg, .jpg, .png and .webp image files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 },
});

const csvFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const isValidExt = path.extname(file.originalname).toLowerCase() === ".csv";
  const isValidMime = /csv|text\/plain|application\/vnd\.ms-excel/i.test(file.mimetype);
  if (isValidExt || isValidMime) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only .csv files are allowed"));
  }
};

/** Kept in memory (never written to disk) since the CSV is parsed once and discarded. */
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
