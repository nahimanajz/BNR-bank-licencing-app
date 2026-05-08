import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/DocumentController';
import { DocumentService } from '../services/DocumentService';
import { DocumentRepository } from '../repositories/DocumentRepository';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditService } from '../services/AuditService';
import { Document, Application, AuditLog } from '../models/index';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const documentRepository = new DocumentRepository(Document);
const applicationRepository = new ApplicationRepository(Application);
const auditLogRepository = new AuditLogRepository(AuditLog);
const auditService = new AuditService(auditLogRepository);
const documentService = new DocumentService(documentRepository, applicationRepository, auditService);
const controller = new DocumentController(documentService);

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, requireRole('APPLICANT'), upload.single('file'), controller.upload);
router.get('/', authMiddleware, controller.list);
router.get('/:docId/download', authMiddleware, controller.download);

export default router;
