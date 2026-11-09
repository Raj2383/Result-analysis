import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import env from '../config/env';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxPdfMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new ApiError(400, 'Only PDF files are allowed'));
    }
    return cb(null, true);
  },
});

/** Express RequestHandler for multipart PDF upload. Field name: `pdf`. */
export function uploadPdf(): ReturnType<typeof multer> {
  return upload;
}

export default upload;
