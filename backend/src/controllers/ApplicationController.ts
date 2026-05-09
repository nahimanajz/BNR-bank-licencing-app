import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/ApplicationService';

export class ApplicationController {
  private applicationService: ApplicationService;

  constructor(applicationService: ApplicationService) {
    this.applicationService = applicationService;
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applications = await this.applicationService.listApplications(
        req.user.id,
        req.user.role
      );
      res.status(200).json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await this.applicationService.createApplication({
        applicant_id: req.user.id,
        institution_name: req.body.institution_name,
      });
      res.status(201).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await this.applicationService.getApplicationWithPermission(
        Number(req.params.id),
        req.user.id,
        req.user.role
      );
      res.status(200).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  };

  transition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await this.applicationService.transition(
        Number(req.params.id),
        req.user.id,
        req.user.role,
        req.body.newStatus,
        req.body.version
      );
      res.status(200).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  };

  provideFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await this.applicationService.provideFeedback(
        Number(req.params.id),
        req.user.id,
        req.body.feedback,
        req.body.version
      );
      res.status(200).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  };

  decide = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await this.applicationService.decide(
        Number(req.params.id),
        req.user.id,
        req.body.decision,
        req.body.notes,
        req.body.version
      );
      res.status(200).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  };
}
