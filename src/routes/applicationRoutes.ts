import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController';
import { ApplicationService } from '../services/ApplicationService';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditService } from '../services/AuditService';
import { StateMachineService } from '../services/StateMachineService';
import { AuthorizationService } from '../services/AuthorizationService';
import { Application, AuditLog } from '../models/index';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { validate } from '../middlewares/validate';
import {
  createApplicationSchema,
  transitionSchema,
  feedbackSchema,
  decideSchema,
} from '../validators/applicationValidator';
import logger from '../config/logger';

const applicationRepository = new ApplicationRepository(Application);
const auditLogRepository = new AuditLogRepository(AuditLog);
const stateMachineService = new StateMachineService();
const auditService = new AuditService(auditLogRepository, logger);
const authorizationService = new AuthorizationService(applicationRepository);
const applicationService = new ApplicationService(
  applicationRepository,
  auditService,
  stateMachineService,
  authorizationService,
  logger
);
const controller = new ApplicationController(applicationService);

const router = Router();

router.get('/', authMiddleware, controller.list);
router.post('/', authMiddleware, requireRole('APPLICANT'), validate(createApplicationSchema), controller.create);
router.get('/:id', authMiddleware, controller.getById);
router.patch('/:id/transition', authMiddleware, validate(transitionSchema), controller.transition);
router.patch('/:id/feedback', authMiddleware, requireRole('REVIEWER'), validate(feedbackSchema), controller.provideFeedback);
router.patch('/:id/decide', authMiddleware, requireRole('APPROVER'), validate(decideSchema), controller.decide);

export default router;
