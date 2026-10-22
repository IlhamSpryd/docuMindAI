import { Request, Response, NextFunction } from 'express';
import { ConversationsService } from './conversations.service';
import { AppError } from '../../utils/app-error';

export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { documentId, title } = req.body;
      if (!documentId) {
        throw new AppError(400, 'DOCUMENT_ID_REQUIRED', 'Properti documentId wajib disertakan.');
      }

      const conv = await this.conversationsService.createConversation({
        documentId,
        userId: req.user!.id,
        title,
      });

      res.status(201).json({ conversation: conv });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentId = req.query.documentId as string | undefined;
      const convs = await this.conversationsService.listConversations(
        req.user!.id,
        documentId
      );

      res.status(200).json({ conversations: convs });
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await this.conversationsService.getMessages(
        req.params.id,
        req.user!.id
      );

      res.status(200).json({ messages });
    } catch (error) {
      next(error);
    }
  };

  askQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question } = req.body;
      if (!question || typeof question !== 'string') {
        throw new AppError(400, 'QUESTION_REQUIRED', 'Pertanyaan wajib disertakan.');
      }

      const result = await this.conversationsService.askQuestion({
        conversationId: req.params.id,
        userId: req.user!.id,
        question,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.conversationsService.deleteConversation(
        req.params.id,
        req.user!.id
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
