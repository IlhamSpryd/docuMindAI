import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { generalRateLimiter } from './middlewares/rate-limit.middleware';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { documentsRouter } from './modules/documents/documents.routes';
import { conversationsRouter } from './modules/conversations/conversations.routes';
import { AppError } from './utils/app-error';

export const app = express();

// 1. Security & Core Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(generalRateLimiter);

// 2. Mount API Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/conversations', conversationsRouter);

// 3. Fallback 404 Route
app.use((req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Rute ${req.method} ${req.path} tidak ditemukan.`));
});

// 4. Global Error Boundary
app.use(errorHandlerMiddleware);
