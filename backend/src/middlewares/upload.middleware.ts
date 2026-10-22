import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/app-error';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        'INVALID_FILE_TYPE',
        'Tipe file tidak didukung. Harap unggah berkas dokumen berekstensi .pdf.'
      )
    );
  }
};

export const pdfUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});
