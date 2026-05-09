import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLog } from '../models/index';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const auditLogRepository = new AuditLogRepository(AuditLog);
const controller = new AuditController(auditLogRepository);

const router = Router();

// REVIEWER + APPROVER can browse all audit entries (optionally filtered by applicationId)
router.get('/', authMiddleware, requireRole('REVIEWER', 'APPROVER'), controller.listByApplication);

// REVIEWER + APPROVER can read audit trail for a specific application
router.get(
  '/applications/:id',
  authMiddleware,
  requireRole('REVIEWER', 'APPROVER'),
  controller.listByApplication
);

export default router;
