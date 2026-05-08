import { Model, DataTypes, Sequelize } from 'sequelize';

export class Document extends Model {
  public id!: number;
  public application_id!: number;
  public filename!: string;
  public original_name!: string;
  public file_size!: number;
  public mime_type!: string | null;
  public uploader_id!: number;
  public version!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export const initDocumentModel = (sequelize: Sequelize): typeof Document => {
  Document.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      application_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      original_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      uploader_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      tableName: 'documents',
      timestamps: true,
      underscored: true,
    }
  );

  return Document;
};
