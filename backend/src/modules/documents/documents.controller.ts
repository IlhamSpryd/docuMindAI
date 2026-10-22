import { Request, Response, NextFunction } from 'express';
import { DocumentsService } from './documents.service';
import { AppError } from '../../utils/app-error';

export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'FILE_REQUIRED', 'Berkas PDF wajib diunggah.');
      }

      const result = await this.documentsService.uploadAndProcessDocument({
        userId: req.user!.id,
        file: req.file,
        customTitle: req.body.title,
      });

      res.status(201).json({
        message: 'File PDF berhasil diunggah dan sedang diproses.',
        document: result,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const docs = await this.documentsService.listDocuments(req.user!.id);
      res.status(200).json({ documents: docs });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doc = await this.documentsService.getDocument(req.params.id, req.user!.id);
      res.status(200).json({ document: doc });
    } catch (error) {
      next(error);
    }
  };

  retry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.documentsService.retryProcessing(req.params.id, req.user!.id);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.documentsService.deleteDocument(req.params.id, req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
