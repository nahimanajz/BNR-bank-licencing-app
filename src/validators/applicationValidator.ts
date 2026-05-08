import Joi from 'joi';

export const createApplicationSchema = Joi.object({
  institution_name: Joi.string().min(2).max(255).required(),
});

export const transitionSchema = Joi.object({
  newStatus: Joi.string()
    .valid(
      'SUBMITTED',
      'UNDER_REVIEW',
      'CLARIFICATION_REQUESTED',
      'RESUBMITTED',
      'DECISION_PENDING',
      'APPROVED',
      'REJECTED'
    )
    .required(),
  version: Joi.number().integer().min(1).required(),
});

export const feedbackSchema = Joi.object({
  feedback: Joi.string().min(1).max(2000).required(),
  version: Joi.number().integer().min(1).required(),
});

export const decideSchema = Joi.object({
  decision: Joi.string().valid('APPROVE', 'REJECT').required(),
  notes: Joi.string().min(1).max(2000).required(),
  version: Joi.number().integer().min(1).required(),
});
