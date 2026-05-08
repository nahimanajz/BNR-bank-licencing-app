import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLog } from '../models/index';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const auditLogRepository = new AuditLogRepository(AuditLog);
const controller = new AuditController(auditLogRepository);

const router = Router();

// ADMIN: GET /audit?applicationId=123
router.get('/', authMiddleware, requireRole('ADMIN'), controller.listByApplication);

// ADMIN + REVIEWER: GET /audit/applications/:id
router.get(
  '/applications/:id',
  authMiddleware,
  requireRole('ADMIN', 'REVIEWER'),
  controller.listByApplication
);

export default router;
