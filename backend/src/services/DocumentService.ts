import path from 'path';
import fs from 'fs/promises';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { AuditService } from './AuditService';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors';
import { Document } from '../models/index';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
]);

const STORAGE_ROOT = path.join(process.cwd(), 'data', 'files');

export class DocumentService {
  private documentRepository: DocumentRepository;
  private applicationRepository: ApplicationRepository;
  private auditService: AuditService;

  constructor(
    documentRepository: DocumentRepository,
    applicationRepository: ApplicationRepository,
    auditService: AuditService
  ) {
    this.documentRepository = documentRepository;
    this.applicationRepository = applicationRepository;
    this.auditService = auditService;
  }

  async upload(applicationId: number, uploaderId: number, file: Express.Multer.File): Promise<Document> {
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File exceeds 5MB limit');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new ValidationError(`Unsupported file type: ${file.mimetype}`);
    }

    const app = await this.applicationRepository.findById(applicationId);
    if (app.applicant_id !== uploaderId) {
      throw new AuthorizationError('Only the applicant can upload documents');
    }

    const existingCount = await this.documentRepository.countByApplicationId(applicationId);
    const version = existingCount + 1;

    const dir = path.join(STORAGE_ROOT, String(applicationId));
    await fs.mkdir(dir, { recursive: true });

    const storedFilename = `v${version}_${Date.now()}_${file.originalname}`;
    await fs.writeFile(path.join(dir, storedFilename), file.buffer);

    const doc = await this.documentRepository.create({
      application_id: applicationId,
      filename: storedFilename,
      original_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      uploader_id: uploaderId,
      version,
    });

    await this.auditService.log({
      userId: uploaderId,
      applicationId,
      action: 'DOCUMENT_UPLOADED',
      beforeState: app.status,
      afterState: app.status,
      details: { filename: file.originalname, version },
    });

    return doc;
  }

  async listByApplication(applicationId: number): Promise<Document[]> {
    await this.applicationRepository.findById(applicationId);
    return this.documentRepository.findByApplicationId(applicationId);
  }

  async download(applicationId: number, documentId: number): Promise<{ filePath: string; originalName: string; mimeType: string }> {
    const doc = await this.documentRepository.findById(documentId);

    if (doc.application_id !== applicationId) {
      throw new NotFoundError('Document not found');
    }

    const filePath = path.join(STORAGE_ROOT, String(applicationId), doc.filename);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundError('File not found on disk');
    }

    return {
      filePath,
      originalName: doc.original_name,
      mimeType: doc.mime_type ?? 'application/octet-stream',
    };
  }
}
