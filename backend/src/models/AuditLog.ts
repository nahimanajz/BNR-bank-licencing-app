import { Model, DataTypes, Sequelize } from 'sequelize';

export class AuditLog extends Model {
  public id!: number;
  public user_id!: number;
  public application_id!: number;
  public action!: string;
  public before_state!: string | null;
  public after_state!: string | null;
  public details!: Record<string, unknown> | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initAuditLogModel = (sequelize: Sequelize): typeof AuditLog => {
  AuditLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      application_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      before_state: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      after_state: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'audit_log',
      timestamps: true,
      underscored: true,
    }
  );

  return AuditLog;
};
