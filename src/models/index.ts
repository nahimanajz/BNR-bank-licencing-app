import { sequelize } from '../config/database';
import { initUserModel, User } from './User';
import { initApplicationModel, Application } from './Application';
import { initDocumentModel, Document } from './Document';
import { initAuditLogModel, AuditLog } from './AuditLog';

initUserModel(sequelize);
initApplicationModel(sequelize);
initDocumentModel(sequelize);
initAuditLogModel(sequelize);

// Associations
User.hasMany(Application, { foreignKey: 'applicant_id', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'applicant_id', as: 'applicant' });

Application.belongsTo(User, { foreignKey: 'current_reviewer_id', as: 'reviewer' });
Application.belongsTo(User, { foreignKey: 'current_approver_id', as: 'approver' });

Application.hasMany(Document, { foreignKey: 'application_id', as: 'documents' });
Document.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

Application.hasMany(AuditLog, { foreignKey: 'application_id', as: 'auditTrail' });
AuditLog.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'actor' });
Document.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });

export { User, Application, Document, AuditLog };
