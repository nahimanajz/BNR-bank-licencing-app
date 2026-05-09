'use strict';

const ALL_NAMES = [
  'Rwanda Savings Bank',
  'Kigali Commercial Bank',
  'BPR Bank Rwanda',
  'Equity Bank Rwanda',
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const users = await queryInterface.sequelize.query(
      `SELECT id, email, role FROM users WHERE email IN (
        'applicant@bnr.rw', 'reviewer@bnr.rw', 'approver@bnr.rw'
      )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
    const applicant = byEmail['applicant@bnr.rw'];
    const reviewer = byEmail['reviewer@bnr.rw'];
    const approver = byEmail['approver@bnr.rw'];

    if (!applicant || !reviewer || !approver) {
      console.warn('Seed 002: users not found — run seed 001 first');
      return;
    }

    const existing = await queryInterface.sequelize.query(
      `SELECT institution_name FROM applications WHERE institution_name IN (
        ${ALL_NAMES.map((n) => `'${n}'`).join(', ')}
      )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const existingNames = new Set(existing.map((r) => r.institution_name));

    const apps = [];

    // SUBMITTED — reviewer can pick this up and start reviewing
    if (!existingNames.has('Rwanda Savings Bank')) {
      apps.push({
        applicant_id: applicant.id,
        institution_name: 'Rwanda Savings Bank',
        status: 'SUBMITTED',
        current_reviewer_id: null,
        current_approver_id: null,
        reviewer_feedback: null,
        decision_notes: null,
        version: 1,
        created_at: now,
        updated_at: now,
      });
    }

    // UNDER_REVIEW — reviewer is actively reviewing this one
    if (!existingNames.has('Kigali Commercial Bank')) {
      apps.push({
        applicant_id: applicant.id,
        institution_name: 'Kigali Commercial Bank',
        status: 'UNDER_REVIEW',
        current_reviewer_id: reviewer.id,
        current_approver_id: null,
        reviewer_feedback: null,
        decision_notes: null,
        version: 2,
        created_at: now,
        updated_at: now,
      });
    }

    // DECISION_PENDING — review complete, approver must decide (and add decision_notes)
    if (!existingNames.has('BPR Bank Rwanda')) {
      apps.push({
        applicant_id: applicant.id,
        institution_name: 'BPR Bank Rwanda',
        status: 'DECISION_PENDING',
        current_reviewer_id: reviewer.id,
        current_approver_id: null,
        reviewer_feedback: null,
        decision_notes: null,
        version: 3,
        created_at: now,
        updated_at: now,
      });
    }

    // APPROVED — shows decision_notes on the detail page
    if (!existingNames.has('Equity Bank Rwanda')) {
      apps.push({
        applicant_id: applicant.id,
        institution_name: 'Equity Bank Rwanda',
        status: 'APPROVED',
        current_reviewer_id: reviewer.id,
        current_approver_id: approver.id,
        reviewer_feedback: null,
        decision_notes: 'All capital requirements met. Board composition is satisfactory. License granted effective immediately.',
        version: 4,
        created_at: now,
        updated_at: now,
      });
    }

    if (apps.length === 0) return;

    await queryInterface.bulkInsert('applications', apps);

    const appIds = await queryInterface.sequelize.query(
      `SELECT id, institution_name FROM applications WHERE institution_name IN (
        ${ALL_NAMES.map((n) => `'${n}'`).join(', ')}
      )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const auditEntries = [];

    for (const app of appIds) {
      const base = {
        application_id: app.id,
        details: null,
        created_at: now,
        updated_at: now,
      };

      if (app.institution_name === 'Rwanda Savings Bank') {
        auditEntries.push(
          { ...base, user_id: applicant.id, action: 'CREATED', before_state: null, after_state: 'DRAFT' },
          { ...base, user_id: applicant.id, action: 'SUBMITTED', before_state: 'DRAFT', after_state: 'SUBMITTED' }
        );
      }

      if (app.institution_name === 'Kigali Commercial Bank') {
        auditEntries.push(
          { ...base, user_id: applicant.id, action: 'CREATED', before_state: null, after_state: 'DRAFT' },
          { ...base, user_id: applicant.id, action: 'SUBMITTED', before_state: 'DRAFT', after_state: 'SUBMITTED' },
          { ...base, user_id: reviewer.id, action: 'UNDER_REVIEW', before_state: 'SUBMITTED', after_state: 'UNDER_REVIEW' }
        );
      }

      if (app.institution_name === 'BPR Bank Rwanda') {
        auditEntries.push(
          { ...base, user_id: applicant.id, action: 'CREATED', before_state: null, after_state: 'DRAFT' },
          { ...base, user_id: applicant.id, action: 'SUBMITTED', before_state: 'DRAFT', after_state: 'SUBMITTED' },
          { ...base, user_id: reviewer.id, action: 'UNDER_REVIEW', before_state: 'SUBMITTED', after_state: 'UNDER_REVIEW' },
          { ...base, user_id: reviewer.id, action: 'DECISION_PENDING', before_state: 'UNDER_REVIEW', after_state: 'DECISION_PENDING' }
        );
      }

      if (app.institution_name === 'Equity Bank Rwanda') {
        auditEntries.push(
          { ...base, user_id: applicant.id, action: 'CREATED', before_state: null, after_state: 'DRAFT' },
          { ...base, user_id: applicant.id, action: 'SUBMITTED', before_state: 'DRAFT', after_state: 'SUBMITTED' },
          { ...base, user_id: reviewer.id, action: 'UNDER_REVIEW', before_state: 'SUBMITTED', after_state: 'UNDER_REVIEW' },
          { ...base, user_id: reviewer.id, action: 'DECISION_PENDING', before_state: 'UNDER_REVIEW', after_state: 'DECISION_PENDING' },
          {
            ...base,
            user_id: approver.id,
            action: 'APPROVED',
            before_state: 'DECISION_PENDING',
            after_state: 'APPROVED',
            details: JSON.stringify({ notes: 'All capital requirements met. Board composition is satisfactory. License granted effective immediately.' }),
          }
        );
      }
    }

    if (auditEntries.length > 0) {
      await queryInterface.bulkInsert('audit_log', auditEntries);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('applications', {
      institution_name: ALL_NAMES,
    });
  },
};
