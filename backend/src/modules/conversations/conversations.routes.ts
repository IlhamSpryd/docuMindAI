import { Router } from 'express';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './conversations.repository';
import { DocumentsRepository } from '../documents/documents.repository';
import { GeminiAIAdapter } from '../../adapters/ai/gemini.adapter';
import { MockAIAdapter } from '../../adapters/ai/mock-ai.adapter';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { chatRateLimiter } from '../../middlewares/rate-limit.middleware';
import { env } from '../../config/env';

export const conversationsRouter = Router();

// Dependency Injection
const conversationsRepo = new ConversationsRepository();
const documentsRepo = new DocumentsRepository();
const aiAdapter = env.AI_PROVIDER === 'mock' ? new MockAIAdapter() : new GeminiAIAdapter();
const conversationsService = new ConversationsService(
  conversationsRepo,
  documentsRepo,
  aiAdapter
);
const conversationsController = new ConversationsController(conversationsService);

conversationsRouter.use(authMiddleware);

conversationsRouter.post('/', conversationsController.create);
conversationsRouter.get('/', conversationsController.list);
conversationsRouter.get('/:id/messages', conversationsController.getMessages);
conversationsRouter.post(
  '/:id/messages',
  chatRateLimiter,
  conversationsController.askQuestion
);
conversationsRouter.delete('/:id', conversationsController.delete);
