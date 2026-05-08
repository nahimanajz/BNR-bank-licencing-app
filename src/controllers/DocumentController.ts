import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/DocumentService';
import { ValidationError } from '../utils/errors';

export class DocumentController {
  private documentService: DocumentService;

  constructor(documentService: DocumentService) {
    this.documentService = documentService;
  }

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('No file provided');
      }
      const doc = await this.documentService.upload(
        Number(req.params.id),
        req.user.id,
        req.file
      );
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const docs = await this.documentService.listByApplication(Number(req.params.id));
      res.status(200).json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { filePath, originalName, mimeType } = await this.documentService.download(
        Number(req.params.id),
        Number(req.params.docId)
      );
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  };
}
