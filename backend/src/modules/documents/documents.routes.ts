import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { SupabaseStorageAdapter } from '../../adapters/storage/supabase-storage.adapter';
import { GeminiAIAdapter } from '../../adapters/ai/gemini.adapter';
import { MockAIAdapter } from '../../adapters/ai/mock-ai.adapter';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { uploadRateLimiter } from '../../middlewares/rate-limit.middleware';
import { pdfUpload } from '../../middlewares/upload.middleware';
import { env } from '../../config/env';

export const documentsRouter = Router();

// Dependency Injection
const documentsRepo = new DocumentsRepository();
const storageAdapter = new SupabaseStorageAdapter();
const aiAdapter = env.AI_PROVIDER === 'mock' ? new MockAIAdapter() : new GeminiAIAdapter();
const documentsService = new DocumentsService(documentsRepo, storageAdapter, aiAdapter);
const documentsController = new DocumentsController(documentsService);

// Routes
documentsRouter.use(authMiddleware);

documentsRouter.get('/', documentsController.list);
documentsRouter.post(
  '/',
  uploadRateLimiter,
  pdfUpload.single('file'),
  documentsController.upload
);
documentsRouter.get('/:id', documentsController.getById);
documentsRouter.post('/:id/retry', documentsController.retry);
documentsRouter.delete('/:id', documentsController.delete);
