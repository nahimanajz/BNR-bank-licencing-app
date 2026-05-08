'use strict';

const bcrypt = require('bcryptjs');

const SEED_USERS = [
  { email: 'applicant@example.com', role: 'APPLICANT', full_name: 'Alice Applicant' },
  { email: 'reviewer@example.com', role: 'REVIEWER', full_name: 'Robert Reviewer' },
  { email: 'approver@example.com', role: 'APPROVER', full_name: 'Anne Approver' },
  { email: 'admin@example.com', role: 'ADMIN', full_name: 'Adam Admin' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const password_hash = await bcrypt.hash('password', 10);

    const existingRows = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE email IN (${SEED_USERS.map((u) => `'${u.email}'`).join(',')})`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingEmails = new Set(existingRows.map((r) => r.email));

    const toInsert = SEED_USERS.filter((u) => !existingEmails.has(u.email)).map((u) => ({
      email: u.email,
      password_hash,
      role: u.role,
      full_name: u.full_name,
      created_at: now,
      updated_at: now,
    }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('users', toInsert);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: SEED_USERS.map((u) => u.email),
    });
  },
};
