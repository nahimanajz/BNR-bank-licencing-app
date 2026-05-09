'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_log', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      application_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'RESTRICT',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      before_state: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      after_state: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
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

    await queryInterface.addIndex('audit_log', ['application_id']);
    await queryInterface.addIndex('audit_log', ['user_id']);

    // Lock audit_log from UPDATE and DELETE at DB level (PostgreSQL RULES)
    await queryInterface.sequelize.query(`
      CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
    `);
    await queryInterface.sequelize.query(`
      CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP RULE IF EXISTS audit_log_no_update ON audit_log;');
    await queryInterface.sequelize.query('DROP RULE IF EXISTS audit_log_no_delete ON audit_log;');
    await queryInterface.dropTable('audit_log');
  },
};
