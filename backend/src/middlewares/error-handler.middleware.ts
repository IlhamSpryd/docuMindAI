import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { logger } from '../config/logger';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;

  // 1. Operational AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId, path: req.path }, err.message);
    } else {
      logger.warn({ errorCode: err.errorCode, statusCode: err.statusCode, requestId, path: req.path }, err.message);
    }

    res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 2. Multer Errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Ukuran file melebihi batas maksimal 10 MB.',
        },
      });
      return;
    }

    res.status(400).json({
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // 3. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data masukan tidak valid.',
        details: formattedErrors,
      },
    });
    return;
  }

  // 4. Invalid JSON Body
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Format payload JSON tidak valid.',
      },
    });
    return;
  }

  // 5. Unhandled / Unexpected Errors
  logger.error({ err, requestId, path: req.path }, 'Unhandled Exception');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.',
    },
  });
}
