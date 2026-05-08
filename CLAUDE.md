# Bank Licensing Portal Development Guidelines

**For:** TypeScript Developer
**Stack:** Node.js/Express + Sequelize (Backend) | Next.js + React Query (Frontend)
**48-Hour Sprint:** Reference SPRINT_48H.md for tickets and timeline

---

## Important: Reference Files

When implementing anything, use only these files for reference:
- `CLAUDE.md` — patterns, architecture, code examples
- `markdowns/TECH_STACK.md` — state machine, schema, roles, API codes
- `markdowns/ARCHITECTURE.md` — request/response flow
- `markdowns/SPRINT_48H.md` — tickets and scope
- `markdowns/EVALUATION_CHECKLIST.md` — what must be correct

**Skip `docs/` entirely.** Those files are challenge inputs, not implementation guides.

---

## Development Philosophy

> Code should read like prose written by a thoughtful engineer, not output from an AI.

**Core Principles:**
- Single Responsibility Principle: Each module does one thing well
- Explicit over clever: Clear is better than compact
- Test critical paths, not everything
- Logs should be informative, not noisy
- Human-readable errors, not stack traces
- **Use ES6 imports/exports everywhere** — no `require()` or `module.exports`

---

## PART A: BACKEND ARCHITECTURE

### App Flow

```
server.ts  (entry point — sets up Express, mounts routes)
    ↓
routes/index.ts  (aggregates all route modules)
    ↓
routes/applicationRoutes.ts  (creates instances, defines endpoints)
    ↓
ApplicationController  (this.applicationService.method())
    ↓
ApplicationService  (this.applicationRepository.method())
    ↓
ApplicationRepository  (this.model.findByPk())
    ↓
models/index.ts  (Sequelize models + associations)
```

---

### Directory Structure

```
backend/
├── src/
|   |--types/.        # All application types     
│   ├── config/
│   │   ├── database.ts        # Sequelize connection
│   │   └── logger.ts          # Winston logger
│   │
│   ├── migrations/
│   │   ├── 001-create-users.ts
│   │   ├── 002-create-applications.ts
│   │   ├── 003-create-documents.ts
│   │   └── 004-create-audit-log.ts
│   │
│   ├── seeders/
│   │   ├── 001-seed-users.ts
│   │   └── 002-seed-applications.ts
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── Application.ts
│   │   ├── Document.ts
│   │   ├── AuditLog.ts
│   │   └── index.ts           # Initialize models + associations
│   │
│   ├── repositories/
│   │   ├── BaseRepository.ts
│   │   ├── UserRepository.ts
│   │   ├── ApplicationRepository.ts
│   │   ├── DocumentRepository.ts
│   │   └── AuditLogRepository.ts
│   │
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── ApplicationService.ts
│   │   ├── DocumentService.ts
│   │   ├── AuditService.ts
│   │   └── StateMachineService.ts
│   │
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── ApplicationController.ts
│   │   ├── DocumentController.ts
│   │   └── AuditController.ts
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.ts      # JWT verification
│   │   ├── roleMiddleware.ts      # Role-based access control
│   │   ├── errorHandler.ts        # Global error handling
│   │   └── validate.ts            # Joi schema validation factory
│   │
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── applicationRoutes.ts
│   │   ├── documentRoutes.ts
│   │   ├── auditRoutes.ts
│   │   └── index.ts               # Aggregates all routes
│   │
│   ├── validators/
│   │   ├── applicationValidator.ts
│   │   └── authValidator.ts
│   │
│   └── utils/
│       ├── errors.ts              # Custom error classes
│       ├── response.ts            # Response formatter
│       └── constants.ts           # App-wide constants
│
├── tests/
│   ├── unit/
│   │   └── StateMachine.test.ts
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── applications.test.ts
│   │   └── concurrent.test.ts
│   └── setup.ts
│
├── .env.example
├── .sequelizerc
├── package.json
└── tsconfig.json
```

---

### 1. server.ts — Entry Point Only

`server.ts` starts Express, sets up middleware, mounts routes. Nothing else.

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database.ts';
import logger from './config/logger.ts';
import router from './routes/index.ts';
import { errorHandler } from './middlewares/errorHandler.ts';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', router);
app.use(errorHandler);

sequelize.authenticate()
  .then(() => logger.info('Database connected'))
  .catch((err) => logger.error('Database connection failed', { error: err.message }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
```

---

### 2. routes/index.ts — Aggregates All Routes

`routes/index.ts` only imports and mounts route modules.

```typescript
import { Router } from 'express';
import authRoutes from './authRoutes.ts';
import applicationRoutes from './applicationRoutes.ts';
import documentRoutes from './documentRoutes.ts';
import auditRoutes from './auditRoutes.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/documents', documentRoutes);
router.use('/audit', auditRoutes);

export default router;
```

---

### 3. Route Files — Create Instances + Define Endpoints

Each route file creates its own instances and defines endpoints.

**routes/applicationRoutes.ts**:
```typescript
import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController.ts';
import { ApplicationService } from '../services/ApplicationService.ts';
import { ApplicationRepository } from '../repositories/ApplicationRepository.ts';
import { AuditService } from '../services/AuditService.ts';
import { AuditLogRepository } from '../repositories/AuditLogRepository.ts';
import { StateMachineService } from '../services/StateMachineService.ts';
import { Application, AuditLog } from '../models/index.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { requireRole } from '../middlewares/roleMiddleware.ts';
import { validate } from '../middlewares/validate.ts';
import { createApplicationSchema, transitionSchema } from '../validators/applicationValidator.ts';
import logger from '../config/logger.ts';

const applicationRepository = new ApplicationRepository(Application);
const auditLogRepository = new AuditLogRepository(AuditLog);
const stateMachineService = new StateMachineService();
const auditService = new AuditService(auditLogRepository, logger);
const applicationService = new ApplicationService(applicationRepository, auditService, stateMachineService, logger);
const controller = new ApplicationController(applicationService);

const router = Router();

router.get('/', authMiddleware, controller.list);
router.post('/', authMiddleware, requireRole('APPLICANT'), validate(createApplicationSchema),  controller.create);
router.get('/:id', authMiddleware, controller.getById);
router.patch('/:id/transition', authMiddleware, validate(transitionSchema),  controller.transition);
router.patch('/:id/decide', authMiddleware, requireRole('APPROVER'),  controller.decide);
router.patch('/:id/feedback', authMiddleware, requireRole('REVIEWER'), controller.provideFeedback);

export default router;
```

**routes/authRoutes.ts**:
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.ts';
import { AuthService } from '../services/AuthService.ts';
import { UserRepository } from '../repositories/UserRepository.ts';
import { User } from '../models/index.ts';
import { validate } from '../middlewares/validate.ts';
import { loginSchema, signupSchema } from '../validators/authValidator.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import logger from '../config/logger.ts';

const userRepository = new UserRepository(User);
const authService = new AuthService(userRepository);
const controller = new AuthController(authService);

const router = Router();

router.post('/signup', validate(signupSchema),controller.signup);
router.post('/login', validate(loginSchema),  controller.login);

export default router;
```

---

### 4. Controllers — TypeScript Classes

Controllers parse the request, call the service, return a response. No business logic.

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/ApplicationService.ts';

export class ApplicationController {
  private applicationService: ApplicationService;

  constructor(applicationService: ApplicationService) {
    this.applicationService = applicationService;
  }

   list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applications = await this.applicationService.listApplications(
        req.user.id,
        req.user.role
      );
      res.status(200).json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  }

   create = async(req: Request, res: Response, next: NextFunction): Promise<void> =>{
    try {
      const application = await this.applicationService.createApplication({
        applicant_id: req.user.id,
        institution_name: req.body.institution_name,
      });
      res.status(201).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

   getById= async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
    try {
      const application = await this.applicationService.getApplicationWithPermission(
        Number(req.params.id),
        req.user.id,
        req.user.role
      );
      res.status(200).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

   decide = async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
    try {
      const application = await this.applicationService.decide(
        Number(req.params.id),
        req.user.id,
        req.body.decision,
        req.body.notes
      );
      res.status(200).json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }
}
```

---

### 5. Services — TypeScript Classes

Services contain all business logic. They call repositories. No HTTP handling.

```typescript
import { ApplicationRepository } from '../repositories/ApplicationRepository.ts';
import { AuditService } from './AuditService.ts';
import { StateMachineService } from './StateMachineService.ts';
import { AuthorizationError, NotFoundError } from '../utils/errors.ts';

export class ApplicationService {
  private applicationRepository: ApplicationRepository;
  private auditService: AuditService;
  private stateMachine: StateMachineService;
  private logger: any;

  constructor(
    applicationRepository: ApplicationRepository,
    auditService: AuditService,
    stateMachine: StateMachineService,
    logger: any
  ) {
    this.applicationRepository = applicationRepository;
    this.auditService = auditService;
    this.stateMachine = stateMachine;
    this.logger = logger;
  }

  async decide(applicationId: number, userId: number, decision: string, notes: string) {
    const app = await this.applicationRepository.findById(applicationId);

    if (app.current_reviewer_id === userId) {
      throw new AuthorizationError('Cannot approve own review');
    }

    const nextStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    this.stateMachine.validateTransition(app.status, nextStatus, 'APPROVER');

    const beforeState = app.status;
    const updated = await this.applicationRepository.update(applicationId, {
      status: nextStatus,
      decision_notes: notes,
      current_approver_id: userId,
    });

    await this.auditService.log({
      userId,
      applicationId,
      action: nextStatus,
      beforeState,
      afterState: nextStatus,
      details: { notes },
    });

    this.logger.info('Application decided', { applicationId, decision: nextStatus, userId });
    return updated;
  }

  async listApplications(userId: number, role: string) {
    if (role === 'APPLICANT') {
      return this.applicationRepository.findByApplicantId(userId);
    }
    return this.applicationRepository.findAll();
  }

  async getApplicationWithPermission(applicationId: number, userId: number, role: string) {
    const app = await this.applicationRepository.findById(applicationId);

    if (role === 'APPLICANT' && app.applicant_id !== userId) {
      throw new AuthorizationError('Forbidden');
    }

    return app;
  }
}
```

---

### 6. Repositories — TypeScript Classes

Repositories only talk to the database. No business logic.

**repositories/BaseRepository.ts**:
```typescript
import { Model, ModelStatic } from 'sequelize';
import { NotFoundError } from '../utils/errors.ts';

export class BaseRepository<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  async findById(id: number): Promise<T> {
    const record = await this.model.findByPk(id);
    if (!record) throw new NotFoundError(`${this.model.name} not found`);
    return record;
  }

  async findAll(where: object = {}): Promise<T[]> {
    return this.model.findAll({ where });
  }

  async create(data: object): Promise<T> {
    return this.model.create(data as any);
  }

  async update(id: number, data: object): Promise<T> {
    const record = await this.findById(id);
    return record.update(data);
  }
}
```

**repositories/ApplicationRepository.ts**:
```typescript
import { Application } from '../models/index.ts';
import { BaseRepository } from './BaseRepository.ts';

export class ApplicationRepository extends BaseRepository<Application> {
  constructor(model: typeof Application) {
    super(model);
  }

  async findByApplicantId(applicantId: number) {
    return this.findAll({ applicant_id: applicantId });
  }

  async findByStatus(status: string) {
    return this.findAll({ status });
  }

  async updateWithVersion(id: number, data: object, expectedVersion: number) {
    const [rowsUpdated] = await this.model.update(
      { ...data, version: expectedVersion + 1 },
      { where: { id, version: expectedVersion } }
    );
    if (rowsUpdated === 0) throw new ConflictError('Application was updated by another user');
    return this.findById(id);
  }
}
```

---

### 7. Models — Sequelize Factory Functions

```typescript
// models/Application.ts
import { Sequelize, DataTypes, Model } from 'sequelize';

export default (sequelize: Sequelize) => {
  class Application extends Model {}

  Application.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    applicant_id: { type: DataTypes.INTEGER, allowNull: false },
    institution_name: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM(
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW',
        'CLARIFICATION_REQUESTED', 'RESUBMITTED',
        'DECISION_PENDING', 'APPROVED', 'REJECTED'
      ),
      defaultValue: 'DRAFT',
    },
    current_reviewer_id: { type: DataTypes.INTEGER, allowNull: true },
    current_approver_id: { type: DataTypes.INTEGER, allowNull: true },
    reviewer_feedback: { type: DataTypes.TEXT, allowNull: true },
    decision_notes: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, defaultValue: 1 },
  }, {
    sequelize,
    tableName: 'applications',
    underscored: true,
  });

  return Application;
};
```

```typescript
// models/index.ts
import { Sequelize } from 'sequelize';
import { sequelize } from '../config/database.ts';
import defineUser from './User.ts';
import defineApplication from './Application.ts';
import defineDocument from './Document.ts';
import defineAuditLog from './AuditLog.ts';

export const User = defineUser(sequelize);
export const Application = defineApplication(sequelize);
export const Document = defineDocument(sequelize);
export const AuditLog = defineAuditLog(sequelize);

// Associations
User.hasMany(Application, { foreignKey: 'applicant_id', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'applicant_id', as: 'applicant' });
Application.belongsTo(User, { foreignKey: 'current_reviewer_id', as: 'reviewer' });
Application.belongsTo(User, { foreignKey: 'current_approver_id', as: 'approver' });
Application.hasMany(Document, { foreignKey: 'application_id', as: 'documents' });
Application.hasMany(AuditLog, { foreignKey: 'application_id', as: 'auditTrail' });

export { sequelize };
```

---

### 8. Middleware

**middlewares/authMiddleware.ts**:
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../utils/errors.ts';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new AuthenticationError('No token provided');

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    next();
  } catch {
    throw new AuthenticationError('Invalid token');
  }
};
```

**middlewares/roleMiddleware.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../utils/errors.ts';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError('Forbidden');
    }
    next();
  };
};
```

**middlewares/validate.ts** — Joi validation factory:
```typescript
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    req.body = value;
    next();
  };
};
```

**middlewares/errorHandler.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.ts';
import logger from '../config/logger.ts';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message, { error: err.name, path: req.path, method: req.method });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
};
```

---

### 9. Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400); }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404); }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') { super(message, 409); }
}

export class InvalidTransitionError extends AppError {
  constructor(message: string) { super(message, 400); }
}
```

---

### 10. State Machine Service

```typescript
// services/StateMachineService.ts
import { AuthorizationError, InvalidTransitionError } from '../utils/errors.ts';

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['CLARIFICATION_REQUESTED', 'DECISION_PENDING'],
  CLARIFICATION_REQUESTED: ['RESUBMITTED'],
  RESUBMITTED: ['UNDER_REVIEW'],
  DECISION_PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

const ROLE_TRANSITIONS: Record<string, Record<string, string[]>> = {
  APPLICANT: { DRAFT: ['SUBMITTED'], CLARIFICATION_REQUESTED: ['RESUBMITTED'] },
  REVIEWER: {
    SUBMITTED: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['CLARIFICATION_REQUESTED', 'DECISION_PENDING'],
    RESUBMITTED: ['UNDER_REVIEW'],
  },
  APPROVER: { DECISION_PENDING: ['APPROVED', 'REJECTED'] },
};

export class StateMachineService {
  validateTransition(currentState: string, nextState: string, role: string): void {
    if (!TRANSITIONS[currentState]?.includes(nextState)) {
      throw new InvalidTransitionError(`Cannot transition from ${currentState} to ${nextState}`);
    }
    if (!ROLE_TRANSITIONS[role]?.[currentState]?.includes(nextState)) {
      throw new AuthorizationError(`${role} cannot perform this transition`);
    }
  }
}
```

---

### 11. Response Format

**Always return:**
```typescript
// Success
{ success: true, data: { ... } }

// Error (from errorHandler)
{ success: false, message: '...' }
```

---

### 12. Testing
### 13. types/ 
 
 Wrong
 
 ```typescript 
   export const fn = (param: {key1:type, key2:stype}) => {

   }
   ```
   Right
   ```typescript
    export const fn = (param: Type) => {

    }

   ```
You can also define dto/ responses and dto/requests/ in this directory of /types
**tests/unit/StateMachine.test.ts**:
```typescript
import { StateMachineService } from '../../src/services/StateMachineService.ts';
import { InvalidTransitionError, AuthorizationError } from '../../src/utils/errors.ts';

describe('StateMachineService', () => {
  const sm = new StateMachineService();

  test('DRAFT → SUBMITTED by APPLICANT passes', () => {
    expect(() => sm.validateTransition('DRAFT', 'SUBMITTED', 'APPLICANT')).not.toThrow();
  });

  test('DRAFT → APPROVED fails (invalid transition)', () => {
    expect(() => sm.validateTransition('DRAFT', 'APPROVED', 'APPLICANT')).toThrow(InvalidTransitionError);
  });

  test('APPROVED is terminal — cannot transition out', () => {
    expect(() => sm.validateTransition('APPROVED', 'REJECTED', 'APPROVER')).toThrow(InvalidTransitionError);
  });

  test('REVIEWER cannot approve', () => {
    expect(() => sm.validateTransition('DECISION_PENDING', 'APPROVED', 'REVIEWER')).toThrow(AuthorizationError);
  });
});
```

**tests/integration/concurrent.test.ts**:
```typescript
import request from 'supertest';
import app from '../../src/server.ts';
import { sequelize } from '../../src/models/index.ts';

describe('Concurrent Update Handling', () => {
  beforeAll(async () => { await sequelize.sync({ force: true }); });
  afterAll(async () => { await sequelize.close(); });

  test('Second update with stale version returns 409', async () => {
    // create app at version 1
    // user B updates → version becomes 2
    // user A submits with version 1 → 409
    const response = await request(app)
      .patch('/api/applications/1/transition')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ newState: 'CLARIFICATION_REQUESTED', version: 1 });

    expect(response.status).toBe(409);
  });
});
```

---

## PART B: FRONTEND ARCHITECTURE

### Tech Stack (Updated)

```json
{
  "framework": "Next.js 14+",
  "library": "React 18+",
  "data-fetching": "TanStack Query (React Query) 5.x",
  "http-client": "Axios",
  "styling": "CSS Modules / Tailwind (optional)",
  "state-management": "Context API only (NO Redux)",
  "forms": "React Hook Form (optional)",
  "testing": "Jest + React Testing Library"
}
```

---

### Directory Structure

```
frontend/
├── src/
│   ├── app/                           # Next.js app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── applications/
│   │   │   │   ├── page.tsx          # List applications
│   │   │   │   └── [id]/page.tsx     # Application detail
│   │   │   ├── audit/page.tsx
│   │   │   └── layout.tsx            # Protected layout
│   │   └── api/                       # API routes (optional)
│   │
│   ├── views/                         # Page-level components
│   │   ├── Auth/
│   │   │   ├── LoginView.tsx
│   │   │   └── SignupView.tsx
│   │   ├── Dashboard/
│   │   │   ├── ApplicationsListView.tsx
│   │   │   ├── ApplicationDetailView.tsx
│   │   │   └── AuditLogView.tsx
│   │
│   ├── components/                    # Reusable components
│   │   ├── Application/
│   │   │   ├── ApplicationCard.tsx
│   │   │   ├── ApplicationForm.tsx
│   │   │   ├── StateTransitionButton.tsx
│   │   │   └── ApplicationDetailPanel.tsx
│   │   ├── Documents/
│   │   │   ├── DocumentUpload.tsx
│   │   │   └── DocumentList.tsx
│   │   ├── Feedback/
│   │   │   ├── FeedbackForm.tsx
│   │   │   └── FeedbackDisplay.tsx
│   │   ├── Common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorAlert.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   └── Nav.tsx
│   │   └── Layout/
│   │       ├── ProtectedLayout.tsx
│   │       └── Header.tsx
│   │
│   ├── services/                     # API service clients
│   │   ├── api.ts                     # Axios instance + interceptors
│   │   ├── auth.service.ts
│   │   ├── application.service.ts
│   │   ├── document.service.ts
│   │   └── audit.service.ts
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.ts                 # Auth state + login/logout
│   │   ├── useApplications.ts         # Queries + mutations
│   │   ├── useDocuments.ts
│   │   └── useAsync.ts
│   │
│   ├── utils/                         # Helper functions
│   │   ├── constants.ts               # API URLs, roles, states
│   │   ├── formatters.ts              # Date, status formatting
│   │   └── errors.ts                  # Error parsing
│   │
│   ├── context/                       # React Context (minimal)
│   │   └── AuthContext.tsx            # Auth state only
│   │
│   ├── types/                         # TypeScript types
│   │   └── index.ts                   # All shared types
│   │
│   └── styles/
│       └── globals.css                # Global styles
│
├── public/
├── .env.example
├── next.config.ts
├── tsconfig.json
└── jest.config.ts
```

---

### Key Patterns

#### 1. Axios Interceptor Configuration (Minimal)

**services/api.ts**:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - ONLY attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - ONLY normalize error shape
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    };
    return Promise.reject(normalizedError);
  }
);

export default apiClient;
```

**Why minimal interceptors?**
- Backend returns structured `{ success, message }` responses
- Error handling decisions (redirect, toast, retry) live in hooks, not interceptors

---

#### 2. Custom Hooks (TanStack Query)

**hooks/useApplications.ts**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services/application.service';

export const useApplications = () =>
  useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationService.getApplications(),
    staleTime: 5 * 60 * 1000,
  });

export const useApplication = (id: number) =>
  useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getApplicationById(id),
    enabled: !!id,
  });

export const useDecideApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, notes }: { id: number; decision: string; notes: string }) =>
      applicationService.decide(id, decision, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};
```

**hooks/useAuth.ts**:
```typescript
import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useLogin = () => {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authService.login(credentials),
    onSuccess: (data) => {
      login(data);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      if (error.status === 401) router.push('/login');
    },
  });
};
```

---

#### 3. Auth Context (Minimal)

```typescript
// context/AuthContext.tsx
'use client';
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (data: any) => {
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

#### 4. Service Files

**services/application.service.ts**:
```typescript
import apiClient from './api';

export const applicationService = {
  getApplications: async () => {
    const { data } = await apiClient.get('/applications');
    return data.data;
  },
  getApplicationById: async (id: number) => {
    const { data } = await apiClient.get(`/applications/${id}`);
    return data.data;
  },
  createApplication: async (payload: { institution_name: string }) => {
    const { data } = await apiClient.post('/applications', payload);
    return data.data;
  },
  decide: async (id: number, decision: string, notes: string) => {
    const { data } = await apiClient.patch(`/applications/${id}/decide`, { decision, notes });
    return data.data;
  },
  requestClarification: async (id: number, feedback: string) => {
    const { data } = await apiClient.patch(`/applications/${id}/feedback`, { feedback });
    return data.data;
  },
};
```

---

#### 5. Components (Functional, with Hooks)

```typescript
// components/Application/StateTransitionButton.tsx
'use client';
import React, { useState } from 'react';
import { useDecideApplication } from '@/hooks/useApplications';

export const StateTransitionButton = ({ application, action }: any) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const decideMutation = useDecideApplication();

  const handleDecide = async (decision: string) => {
    try {
      setError(null);
      await decideMutation.mutateAsync({ id: application.id, decision, notes });
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />
      {action === 'APPROVE' && (
        <button onClick={() => handleDecide('APPROVE')} disabled={decideMutation.isPending}>
          {decideMutation.isPending ? 'Approving...' : 'Approve'}
        </button>
      )}
      {action === 'REJECT' && (
        <button onClick={() => handleDecide('REJECT')} disabled={decideMutation.isPending}>
          {decideMutation.isPending ? 'Rejecting...' : 'Reject'}
        </button>
      )}
    </div>
  );
};
```

---

#### 6. Protected Layout

```typescript
// app/(dashboard)/layout.tsx
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div>Loading...</div>;
  if (!user) { router.push('/login'); return null; }

  return <div>{children}</div>;
}
```

---

## Integration Points (Backend ↔ Frontend)

### Response Format

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, message: '...' }
```

### HTTP Codes

| Code | Meaning | Frontend Action |
|---|---|---|
| 200/201 | Success | Refetch data, show success |
| 400 | Bad request | Show validation message |
| 401 | Unauthorized | Redirect to login, clear token |
| 403 | Forbidden | Show "you don't have permission" |
| 404 | Not found | Show "resource not found" |
| 409 | Conflict | Show "data changed, please refresh" |
| 500 | Server error | Show "server error, try later" |

---

## Environment Variables

**Backend (.env):**
```
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/bank_licensing
JWT_SECRET=your-secret-key-here
LOG_LEVEL=info
PORT=3000
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Git Conventions

### Commit Messages
```
TICKET-001: Brief description

- What changed
- Why it changed
```

### Before Committing
```bash
npm run lint
npm test
npm run build
```
