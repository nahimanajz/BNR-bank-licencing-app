# 48-Hour Sprint Plan: Bank Licensing Portal MVP

**Objective**: Ship a working, secure, auditable system that passes the core evaluation criteria.

**Key Principle**: A correct incomplete system beats a "feature-complete" insecure one. We optimize for:
1. Security (role enforcement, separation of duties)
2. Auditability (every action logged)
3. Correctness (state machine integrity)
4. Testability (critical paths covered)

---

## Realistic Scope (What Ships in 48h)

### ✅ WILL SHIP
- JWT-based auth + 3-role RBAC
- 5-state workflow (DRAFT → SUBMITTED → UNDER_REVIEW → DECISION_PENDING → APPROVED/REJECTED)
- Applicant: create app, upload docs, view status
- Reviewer: read app, request clarifications
- Approver: make final decision (cannot review own apps)
- Append-only audit log (immutable at DB level)
- Document upload + basic versioning (5MB limit)
- State machine tested (valid/invalid transitions)
- Role-based access tested (each role's boundaries)
- Seed script (1 user per role, 2 apps in different states)
- API docs (README or basic OpenAPI)
- Basic React frontend (role-specific views)

### ❌ OUT OF SCOPE (Phase 2)
- Hash chain validation for audit trail
- Optimistic locking for concurrent updates (pessimistic lock instead)
- Advanced search/filtering
- Document versioning history UI
- Email notifications
- Sophisticated error recovery
- User management UI

---

## Time Budget

| Component | Est. Hours | Notes |
|---|---|---|
| Setup + DB schema | 6h | Node/Express, PostgreSQL, migrations |
| Auth system | 5h | JWT, bcrypt, user seed |
| State machine handler | 4h | Core transitions, validation |
| Application CRUD | 4h | Create, read, update with state checks |
| Document handling | 3h | Upload, storage, versioning (basic) |
| Audit logging | 3h | Append-only service, immutability |
| Authorization middleware | 2h | Role checks, separation of duties check |
| Tests (critical paths) | 6h | State machine, auth, concurrent edge case |
| Frontend MVP | 6h | Login, role dashboards, basic workflows |
| API docs + seed script | 3h | Postman collection + setup script |
| Buffer/debugging | 4h | Contingency |
| **TOTAL** | **46h** | |

---

## Ticket Breakdown

**Legend**: 
- `[P0]` = Blocking (must complete)
- `[P1]` = Critical (strongly recommended)
- `[P2]` = Nice-to-have
- Time estimates are per-ticket, sequential work

---

### PHASE 1: SETUP & INFRASTRUCTURE (6 hours)

#### TICKET-001: Project scaffolding & database setup [P0] — 2h
**Description**:
- Init Node.js/Express project with TypeScript
- PostgreSQL local setup
- Create `.env` template (JWT_SECRET, DB_URL, etc.)
- Flyway/TypeORM migrations structure

**Acceptance Criteria**:
- `npm start` runs the server on port 3000
- Database connection works
- `.env.example` provided

**Files to Create**:
- `package.json`, `tsconfig.json`, `src/server.ts`
- `src/database/migrations/001_init.sql` (empty, will populate in TICKET-002)

---

#### TICKET-002: Database schema [P0] — 2h
**Description**:
Create core schema: users, applications, documents, audit_log

**Schema** (PostgreSQL):
```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('APPLICANT', 'REVIEWER', 'APPROVER', 'ADMIN')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  applicant_id INT NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' 
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUESTED', 'DECISION_PENDING', 'APPROVED', 'REJECTED')),
  institution_name VARCHAR(255) NOT NULL,
  current_reviewer_id INT REFERENCES users(id),
  current_approver_id INT REFERENCES users(id),
  reviewer_feedback TEXT,
  decision_notes TEXT,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES applications(id),
  filename VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100),
  uploader_id INT NOT NULL REFERENCES users(id),
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log (IMMUTABLE)
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  application_id INT NOT NULL REFERENCES applications(id),
  action VARCHAR(100) NOT NULL,
  before_state VARCHAR(50),
  after_state VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lock audit_log from updates/deletes at DB level
CREATE RULE audit_log_immutable AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_audit_log_app ON audit_log(application_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
```

**Acceptance Criteria**:
- Schema loads without errors
- Audit log is write-only (UPDATE/DELETE blocked at DB layer)
- Foreign keys enforced

---

#### TICKET-003: TypeORM entities & migrations [P0] — 2h
**Description**:
Create ORM entities mapping to schema. Use TypeORM for type safety.

**Files**:
- `src/entities/User.ts`
- `src/entities/Application.ts`
- `src/entities/Document.ts`
- `src/entities/AuditLog.ts`
- `src/database/migrations/001_init.ts` (TypeORM migration)

**Acceptance Criteria**:
- Entities compile with no type errors
- `npm run typeorm migration:run` succeeds
- Relationships (foreign keys) correctly typed

---

### PHASE 2: AUTHENTICATION & AUTHORIZATION (5 hours)

#### TICKET-004: JWT auth system [P0] — 2.5h
**Description**:
Implement sign-up, login, token generation + verification.

**Requirements**:
- Sign-up: email + password → hash (bcrypt) → user record
- Login: email + password → compare → return JWT (userId, role, exp)
- JWT middleware: verify token → attach user to request
- Refresh token: simple 7-day expiry

**Files**:
- `src/services/AuthService.ts` (sign-up, login, verify)
- `src/middleware/authMiddleware.ts` (JWT verify)
- `src/routes/auth.ts` (POST /auth/signup, POST /auth/login)

**API**:
```
POST /auth/signup
  Body: { email, password, role }
  Response: { userId, email, role }

POST /auth/login
  Body: { email, password }
  Response: { token, expiresIn: 86400 }

GET /auth/me (requires token)
  Response: { userId, email, role }
```

**Acceptance Criteria**:
- Sign-up hashes password (bcrypt rounds = 10)
- Login returns valid JWT
- Invalid password returns 401
- Middleware validates JWT on protected routes
- Tests: valid login, invalid password, expired token

---

#### TICKET-005: Role-based access control (RBAC) [P0] — 1.5h
**Description**:
Create role middleware + authorization service.

**Roles**:
- **APPLICANT**: Can create/read own applications, upload docs
- **REVIEWER**: Can read any application, provide feedback, request clarifications
- **APPROVER**: Can read any application, make final decision
- **ADMIN**: Read-only audit log, user management

**Hard Rule**: Reviewer ≠ Approver on same application (enforced in handlers)

**Files**:
- `src/middleware/roleMiddleware.ts` (requireRole decorator)
- `src/services/AuthorizationService.ts` (canActOnApplication, canReview, canApprove)

**Code Pattern**:
```typescript
router.post('/applications/:id/approve', 
  authMiddleware,
  requireRole('APPROVER'),
  async (req, res) => {
    const allowed = await authService.canApprove(req.user.id, req.params.id);
    if (!allowed) return res.status(403).json({ error: 'Not authorized' });
    // ... approve logic
  }
);
```

**Acceptance Criteria**:
- requireRole middleware returns 403 for wrong role
- canApprove() checks reviewer ≠ approver
- Tests: each role tested against unauthorized actions

---

#### TICKET-006: User seed script [P0] — 1h
**Description**:
Create `scripts/seed.ts` that populates test users (1 per role).

**Users created**:
```
1. applicant@example.com / password (APPLICANT)
2. reviewer@example.com / password (REVIEWER)
3. approver@example.com / password (APPROVER)
4. admin@example.com / password (ADMIN)
```

**Acceptance Criteria**:
- `npm run seed` creates exactly 4 users
- Each has correct role
- Passwords are hashed
- Idempotent (safe to run multiple times)

---

### PHASE 3: STATE MACHINE & CORE APPLICATION LOGIC (8 hours)

#### TICKET-007: State machine handler [P0] — 2.5h
**Description**:
Core state machine as a class. Single source of truth for transitions.

**File**: `src/services/StateMachine.ts`

**Valid Transitions**:
```
DRAFT → SUBMITTED (applicant submits)
SUBMITTED → UNDER_REVIEW (reviewer accepts)
UNDER_REVIEW → CLARIFICATION_REQUESTED (reviewer requests more docs)
CLARIFICATION_REQUESTED → RESUBMITTED (applicant uploads docs)
RESUBMITTED → UNDER_REVIEW (reviewer reviews again)
UNDER_REVIEW → DECISION_PENDING (reviewer completes review)
DECISION_PENDING → APPROVED (approver approves)
DECISION_PENDING → REJECTED (approver rejects)
[APPROVED/REJECTED are terminal — no further transitions]
```

**Class Methods**:
```typescript
class StateMachine {
  canTransition(fromState: string, toState: string, actor: Role): boolean
  getNextStates(currentState: string, actor: Role): string[]
  transition(app: Application, newState: string, actor: Role): void
}
```

**Acceptance Criteria**:
- All valid transitions allowed
- Invalid transitions rejected with clear error
- Role constraints enforced (only reviewer can move to CLARIFICATION_REQUESTED, etc.)
- Tests: transition matrix (20+ cases)

---

#### TICKET-008: Application CRUD endpoints [P0] — 2.5h
**Description**:
Create, read, update applications with state validation.

**Endpoints**:
```
POST /applications (APPLICANT)
  Body: { institutionName, ... }
  Response: { id, status: 'DRAFT', ... }

GET /applications (all roles, filtered by permission)
  APPLICANT: sees own only
  REVIEWER/APPROVER/ADMIN: sees all
  Response: [ { id, institutionName, status, createdAt, ... } ]

GET /applications/:id (all roles, filtered by permission)
  Response: { id, status, ..., reviewerFeedback?, decisionNotes? }

PUT /applications/:id/transition (state changes)
  Body: { newState }
  Validates transition via StateMachine
  Response: { id, status, ... } or 400/403

PATCH /applications/:id/feedback (REVIEWER)
  Body: { feedback, newState }
  Updates reviewer_feedback, transitions if valid
  Response: { id, status, ... }

PATCH /applications/:id/decide (APPROVER)
  Body: { decision: 'APPROVED'|'REJECTED', notes }
  Validates approver ≠ reviewer
  Response: { id, status, ... }
```

**Acceptance Criteria**:
- POST creates app in DRAFT state
- PUT with invalid transition returns 400
- Applicant cannot see others' apps (403)
- Reviewer cannot approve (403 if both=reviewer)
- Tests: happy path, 3 authorization violations

---

#### TICKET-009: Document upload & versioning [P0] — 2h
**Description**:
Handle file upload, size validation, metadata storage.

**Endpoints**:
```
POST /applications/:id/documents (APPLICANT)
  Multipart form-data: file (max 5MB)
  Validates: file size ≤ 5MB, mime type (PDF/PNG/etc.)
  Stores: /data/files/{appId}/{fileName}
  Response: { id, filename, size, uploadedAt, version: 1 }

GET /applications/:id/documents (all roles)
  Response: [ { id, filename, size, uploadedAt, version } ]

GET /applications/:id/documents/:docId/download (all roles)
  Response: File binary
```

**Storage Strategy**:
- Simulate file storage in `/data/files/{appId}/` directory
- On resubmit (CLARIFICATION_REQUESTED → RESUBMITTED):
  - New file = version 2
  - Old version still accessible
- Metadata stored in DB (filename, size, mime_type, uploaded_at, version)

**Acceptance Criteria**:
- File > 5MB rejected with 413
- Invalid mime type rejected
- Document metadata persisted
- Multiple versions accessible
- Tests: valid upload, size rejection, versioning

---

### PHASE 4: AUDIT & LOGGING (3 hours)

#### TICKET-010: Append-only audit logger [P0] — 2h
**Description**:
Service that logs every application state change. Database layer prevents deletion.

**File**: `src/services/AuditLogger.ts`

**Method**:
```typescript
async logAction(
  userId: number,
  applicationId: number,
  action: string,
  beforeState: string,
  afterState: string,
  details?: object
): Promise<void>
```

**Logged Actions**:
- Application created
- Application submitted
- Reviewer assigned
- Feedback provided
- Decision made (APPROVED/REJECTED)

**Immutability Enforcement**:
- Database-level RULES prevent UPDATE/DELETE
- Service only calls INSERT
- Audit query service for read-only access

**Acceptance Criteria**:
- Each transition logged with before/after state
- Timestamp captured
- DB prevents deletion (verify with SQL)
- Tests: insert, verify immutable, attempt delete fails

---

#### TICKET-011: Audit log query API [P1] — 1h
**Description**:
Read-only endpoint for audit log (ADMIN + REVIEWER for own reviews).

**Endpoints**:
```
GET /audit?applicationId={id} (ADMIN)
  Response: [ { userId, action, beforeState, afterState, timestamp, details } ]

GET /audit/applications/:id (REVIEWER viewing own reviews)
  Response: [audit entries for that app]
```

**Acceptance Criteria**:
- Non-admin cannot access full audit log
- Returns most recent entries first
- Timestamp in ISO format

---

### PHASE 5: TESTING (6 hours)

#### TICKET-012: State machine unit tests [P0] — 1.5h
**Description**:
Comprehensive state machine tests covering valid/invalid transitions.

**Test Cases** (15+):
```
✓ DRAFT → SUBMITTED (applicant)
✓ SUBMITTED → DRAFT (applicant) — should fail
✓ UNDER_REVIEW → CLARIFICATION_REQUESTED (reviewer)
✓ UNDER_REVIEW → APPROVED (reviewer) — should fail (only approver)
✓ DECISION_PENDING → APPROVED (approver)
✓ DECISION_PENDING → APPROVED (reviewer) — should fail
✓ APPROVED → REJECTED (approver) — should fail (terminal)
[... 8 more edge cases]
```

**File**: `src/services/__tests__/StateMachine.test.ts`

**Acceptance Criteria**:
- 20+ test cases, all passing
- Coverage: 100% of StateMachine class
- Tests run in <2s

---

#### TICKET-013: Authorization tests [P0] — 1.5h
**Description**:
Test role boundaries and separation of duties.

**Test Cases** (12+):
```
✓ APPLICANT can create own application
✓ APPLICANT cannot read others' applications
✓ REVIEWER can read all applications
✓ REVIEWER cannot approve
✓ APPROVER cannot approve own review
✓ APPROVER can approve reviews by others
✓ ADMIN cannot modify (read-only)
[... 5 more scenarios]
```

**File**: `src/services/__tests__/Authorization.test.ts`

**Acceptance Criteria**:
- All role boundaries tested
- Separation of duties tested (reviewer ≠ approver)
- 100% of AuthorizationService covered

---

#### TICKET-014: Concurrent update test [P0] — 1h
**Description**:
Simulate two users updating same application simultaneously.

**Scenario**:
1. User A fetches app (version=1, status=UNDER_REVIEW)
2. User B fetches app (version=1, status=UNDER_REVIEW)
3. User B updates to DECISION_PENDING, version→2
4. User A tries to update to CLARIFICATION_REQUESTED with version=1
5. Should fail with 409 Conflict

**Implementation** (simple pessimistic lock):
```sql
UPDATE applications SET status = $1, version = version + 1 
WHERE id = $2 AND version = $3
-- If 0 rows affected → conflict
```

**File**: `src/routes/__tests__/concurrent.test.ts`

**Acceptance Criteria**:
- Concurrent update detected
- Returns 409 Conflict
- Second user cannot proceed without refetch

---

#### TICKET-015: API integration test [P1] — 1.5h
**Description**:
Happy path end-to-end: applicant submits → reviewer reviews → approver approves.

**Scenario**:
1. Applicant creates app (status=DRAFT)
2. Applicant submits (status=SUBMITTED)
3. Upload document
4. Reviewer reads app
5. Reviewer provides feedback (status=UNDER_REVIEW)
6. Reviewer completes review (status=DECISION_PENDING)
7. Approver approves (status=APPROVED)
8. Verify audit log captures all steps

**File**: `src/__tests__/integration.test.ts`

**Acceptance Criteria**:
- All endpoints return correct status codes
- State transitions logged in audit
- Document accessible throughout

---

### PHASE 6: FRONTEND MVP (6 hours)

#### TICKET-016: React setup & auth flow [P0] — 2h
**Description**:
Create-react-app, login page, route guards.

**Structure**:
```
src/
  pages/
    Login.tsx
    Dashboard.tsx
  components/
    ProtectedRoute.tsx
    Nav.tsx
  services/
    api.ts (fetch wrapper with JWT)
  App.tsx
```

**Features**:
- Login page (email/password)
- Store token in localStorage
- ProtectedRoute redirects to login if no token
- Nav shows username + logout

**Acceptance Criteria**:
- Login works with seed user credentials
- Invalid creds show error
- Logout clears token
- Protected route redirects to login

---

#### TICKET-017: Role-specific dashboards [P0] — 2h
**Description**:
Four separate dashboard views (one per role).

**APPLICANT Dashboard**:
- List own applications
- Create new button
- View app details → upload docs → submit

**REVIEWER Dashboard**:
- List all applications with status=SUBMITTED or UNDER_REVIEW
- Open to read → provide feedback → request clarifications

**APPROVER Dashboard**:
- List all applications with status=DECISION_PENDING
- Open to read feedback → approve/reject with notes

**ADMIN Dashboard**:
- Read-only audit log viewer
- List all applications (read-only)

**Acceptance Criteria**:
- Each role sees only relevant apps
- Cannot perform actions outside role
- Load states shown
- Error states (API failures) shown

---

#### TICKET-018: Application detail & workflow UI [P0] — 2h
**Description**:
Single application view with state-specific actions.

**Components**:
- Application header (name, status, dates)
- State transition buttons (only valid ones shown)
- Document list + upload (applicants only)
- Feedback textarea (reviewers only)
- Approve/Reject buttons (approvers only)
- Audit trail (read-only, bottom of page)

**Acceptance Criteria**:
- Buttons disabled for wrong role
- Upload limits enforced (5MB shown to user)
- Feedback textarea required before transition
- Audit trail loads asynchronously

---

### PHASE 7: API DOCUMENTATION & SEED (3 hours)

#### TICKET-019: OpenAPI spec & Postman [P1] — 2h
**Description**:
Document all endpoints, request/response schemas, error codes.

**Format**: OpenAPI 3.0 YAML (auto-generated from JSDoc comments)

**Coverage**:
- All 10 endpoints
- Request/response schemas
- Error responses (401, 403, 400, 409)
- Auth header requirement
- Example requests (sign-up, login, create app, etc.)

**File**: `openapi.yaml`

**Tools**: 
- Use `swagger-jsdoc` to auto-generate from comments
- Host with Swagger UI endpoint: GET /api-docs

**Acceptance Criteria**:
- All endpoints documented
- Examples are functional (tested)
- Auth pattern clear
- Postman collection exports cleanly

---

#### TICKET-020: Application seed script (2 apps) [P1] — 1h
**Description**:
Create 2 pre-filled applications in different states.

**Apps**:
```
1. ABC Bank (SUBMITTED)
   - Created by applicant@example.com
   - Waiting for reviewer
   
2. XYZ Credit Union (UNDER_REVIEW)
   - Created by applicant@example.com
   - Assigned to reviewer@example.com
   - Has feedback attached
```

**File**: `scripts/seedApplications.ts`

**Acceptance Criteria**:
- `npm run seed:apps` creates 2 apps
- Each app in correct state
- Documents attached to at least one
- Audit log shows creation events

---

### PHASE 8: DOCUMENTATION (1 hour)

#### TICKET-021: README [P0] — 1h
**Description**:
Quick-start guide for running the system.

**Sections**:
```
# Bank Licensing Portal

## Quick Start
1. `npm install`
2. `createdb bank_licensing`
3. `npm run migrate`
4. `npm run seed`
5. `npm start` (backend on :3000)
6. In another terminal: `cd frontend && npm start` (frontend on :3000)

## Default Users
- applicant@example.com / password
- reviewer@example.com / password
- approver@example.com / password
- admin@example.com / password

## API Documentation
Visit http://localhost:3000/api-docs after starting the server.

## Architecture
[Describe components, state machine, audit trail design]

## Design Decisions
[Explain JWT vs sessions, why this state machine, why audit immutable at DB level]
```

**Acceptance Criteria**:
- Instructions are copy-paste ready
- Someone can get system running in <10 min
- Key design decisions explained

---

## Success Criteria (Definition of Done)

- [ ] All 21 tickets completed and tested
- [ ] System runs end-to-end: applicant submits → reviewer reviews → approver approves
- [ ] Audit log captures every step, immutable at DB level
- [ ] All critical tests pass (state machine, auth, concurrent)
- [ ] Reviewer cannot approve own review (separation of duties enforced)
- [ ] Role boundaries enforced at API level (not just UI)
- [ ] Documentation complete (README + API spec)
- [ ] Seed script creates 4 users + 2 apps
- [ ] No raw stack traces in API responses
- [ ] Unauthorized requests return 403, not 404

---

## Risk Mitigations

| Risk | Mitigation |
|---|---|
| Running out of time | Drop TICKET-017 (fewer role dashboards), consolidate into one view |
| Concurrent update complexity | Use simple pessimistic locking (version column + WHERE clause) |
| Audit trail not immutable | Test DB rules work; implement at SQL layer, not app layer |
| State machine bugs | Test every transition; unit tests must pass before moving to integration |

---

## Nice-to-Haves (If Time Allows)

- [ ] Hash chain for audit trail (SHA-256 chaining)
- [ ] Search/filter on application list
- [ ] Document download versioning (show v1, v2, etc.)
- [ ] Email notifications (log to console instead)
- [ ] Rate limiting on auth endpoints
- [ ] Password reset flow
- [ ] User management UI (create/disable users)

