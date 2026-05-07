'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      applicant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      institution_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'DRAFT',
          'SUBMITTED',
          'UNDER_REVIEW',
          'CLARIFICATION_REQUESTED',
          'RESUBMITTED',
          'DECISION_PENDING',
          'APPROVED',
          'REJECTED'
        ),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      current_reviewer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      current_approver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      reviewer_feedback: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      decision_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('applications', ['applicant_id']);
    await queryInterface.addIndex('applications', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('applications');
  },
};
