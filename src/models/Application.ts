import { Model, DataTypes, Sequelize } from 'sequelize';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUESTED'
  | 'RESUBMITTED'
  | 'DECISION_PENDING'
  | 'APPROVED'
  | 'REJECTED';

export class Application extends Model {
  public id!: number;
  public applicant_id!: number;
  public institution_name!: string;
  public status!: ApplicationStatus;
  public current_reviewer_id!: number | null;
  public current_approver_id!: number | null;
  public reviewer_feedback!: string | null;
  public decision_notes!: string | null;
  public version!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initApplicationModel = (sequelize: Sequelize): typeof Application => {
  Application.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      applicant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      institution_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
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
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      current_approver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reviewer_feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      decision_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'applications',
      timestamps: true,
      underscored: true,
    }
  );

  return Application;
};
