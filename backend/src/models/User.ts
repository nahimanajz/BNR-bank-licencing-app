import { Model, DataTypes, Sequelize } from 'sequelize';

export class User extends Model {
  public id!: number;
  public email!: string;
  public password_hash!: string;
  public role!: 'APPLICANT' | 'REVIEWER' | 'APPROVER';
  public full_name!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initUserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('APPLICANT', 'REVIEWER', 'APPROVER'),
        allowNull: false,
        defaultValue: 'APPLICANT',
      },
      full_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      underscored: true,
    }
  );

  return User;
};
