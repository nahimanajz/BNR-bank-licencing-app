import { StateMachineService } from '../../src/services/StateMachineService';
import { InvalidTransitionError, AuthorizationError } from '../../src/utils/errors';

describe('StateMachineService', () => {
  const sm = new StateMachineService();

  describe('valid transitions', () => {
    test('DRAFT → SUBMITTED by APPLICANT', () => {
      expect(() => sm.validateTransition('DRAFT', 'SUBMITTED', 'APPLICANT')).not.toThrow();
    });

    test('SUBMITTED → UNDER_REVIEW by REVIEWER', () => {
      expect(() => sm.validateTransition('SUBMITTED', 'UNDER_REVIEW', 'REVIEWER')).not.toThrow();
    });

    test('UNDER_REVIEW → CLARIFICATION_REQUESTED by REVIEWER', () => {
      expect(() =>
        sm.validateTransition('UNDER_REVIEW', 'CLARIFICATION_REQUESTED', 'REVIEWER')
      ).not.toThrow();
    });

    test('UNDER_REVIEW → DECISION_PENDING by REVIEWER', () => {
      expect(() =>
        sm.validateTransition('UNDER_REVIEW', 'DECISION_PENDING', 'REVIEWER')
      ).not.toThrow();
    });

    test('CLARIFICATION_REQUESTED → RESUBMITTED by APPLICANT', () => {
      expect(() =>
        sm.validateTransition('CLARIFICATION_REQUESTED', 'RESUBMITTED', 'APPLICANT')
      ).not.toThrow();
    });

    test('RESUBMITTED → UNDER_REVIEW by REVIEWER', () => {
      expect(() => sm.validateTransition('RESUBMITTED', 'UNDER_REVIEW', 'REVIEWER')).not.toThrow();
    });

    test('DECISION_PENDING → APPROVED by APPROVER', () => {
      expect(() =>
        sm.validateTransition('DECISION_PENDING', 'APPROVED', 'APPROVER')
      ).not.toThrow();
    });

    test('DECISION_PENDING → REJECTED by APPROVER', () => {
      expect(() =>
        sm.validateTransition('DECISION_PENDING', 'REJECTED', 'APPROVER')
      ).not.toThrow();
    });
  });

  describe('invalid transitions — wrong state', () => {
    test('DRAFT → APPROVED fails', () => {
      expect(() => sm.validateTransition('DRAFT', 'APPROVED', 'APPLICANT')).toThrow(
        InvalidTransitionError
      );
    });

    test('APPROVED is terminal — cannot transition out', () => {
      expect(() => sm.validateTransition('APPROVED', 'REJECTED', 'APPROVER')).toThrow(
        InvalidTransitionError
      );
    });

    test('REJECTED is terminal — cannot transition out', () => {
      expect(() => sm.validateTransition('REJECTED', 'APPROVED', 'APPROVER')).toThrow(
        InvalidTransitionError
      );
    });

    test('SUBMITTED → APPROVED skips steps', () => {
      expect(() => sm.validateTransition('SUBMITTED', 'APPROVED', 'APPROVER')).toThrow(
        InvalidTransitionError
      );
    });
  });

  describe('invalid transitions — wrong role', () => {
    test('APPLICANT cannot move to UNDER_REVIEW', () => {
      expect(() => sm.validateTransition('SUBMITTED', 'UNDER_REVIEW', 'APPLICANT')).toThrow(
        AuthorizationError
      );
    });

    test('REVIEWER cannot approve', () => {
      expect(() =>
        sm.validateTransition('DECISION_PENDING', 'APPROVED', 'REVIEWER')
      ).toThrow(AuthorizationError);
    });

    test('REVIEWER cannot reject', () => {
      expect(() =>
        sm.validateTransition('DECISION_PENDING', 'REJECTED', 'REVIEWER')
      ).toThrow(AuthorizationError);
    });

    test('APPROVER cannot submit', () => {
      expect(() => sm.validateTransition('DRAFT', 'SUBMITTED', 'APPROVER')).toThrow(
        AuthorizationError
      );
    });

    test('APPROVER cannot request clarification', () => {
      expect(() =>
        sm.validateTransition('UNDER_REVIEW', 'CLARIFICATION_REQUESTED', 'APPROVER')
      ).toThrow(AuthorizationError);
    });
  });

  describe('getNextStates', () => {
    test('APPLICANT in DRAFT can submit', () => {
      expect(sm.getNextStates('DRAFT', 'APPLICANT')).toEqual(['SUBMITTED']);
    });

    test('REVIEWER in UNDER_REVIEW gets clarification or decision pending', () => {
      expect(sm.getNextStates('UNDER_REVIEW', 'REVIEWER')).toEqual([
        'CLARIFICATION_REQUESTED',
        'DECISION_PENDING',
      ]);
    });

    test('APPROVER in APPROVED has no next states', () => {
      expect(sm.getNextStates('APPROVED', 'APPROVER')).toEqual([]);
    });
  });
});
