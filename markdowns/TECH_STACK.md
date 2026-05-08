# Technical Stack & Architecture Reference

## Tech Stack Decisions (Why This Matters)

### Backend: Node.js + Express + TypeScript
- **Why TypeScript?** Catches type errors at compile time (critical for authorization logic)
- **Why Express?** Lightweight, great middleware ecosystem, fast to scaffold
- **Why NOT FastAPI/Python?** Slightly slower to set up; time is money in 48h
- **Alternative considered:** Go (fast, but steeper learning curve)

### Database: PostgreSQL (Local)
- **Why PostgreSQL?** Built-in immutability via RULES, strong constraints, JSONB for audit details
- **Why NOT SQLite?** RULES not supported; easier to accidentally delete audit entries
- **Why local?** No cloud setup needed; evaluators expect copy-paste simplicity

### Frontend: React + TypeScript
- **Why React?** Standard for internal tools, familiar
- **Why NOT Vue/Svelte?** Ecosystem maturity for this scope
- **State management:** React Context (not Redux) — overkill for this size

### ORM: TypeORM
- **Why TypeORM?** Type-safe, migrations built-in, works with Express
- **Why NOT raw SQL?** Migrations harder to version; migrations are critical for repeatable deployments
- **Why NOT Prisma?** Setup slightly slower, but Prisma is fine alternative if you prefer

### Testing: Jest
- **Why Jest?** Works with TypeScript, snapshot testing, great DX
- **For integration:** Supertest (test HTTP endpoints directly)

---

## Database Schema (PostgreSQL)

### Immutability at DB Layer

This is critical for audit compliance. The `audit_log` table uses PostgreSQL RULES to prevent updates/deletes:

```sql
-- In migration 001_init.sql:

CREATE RULE audit_log_immutable AS 
  ON UPDATE TO audit_log 
  DO INSTEAD NOTHING;

CREATE RULE audit_log_no_delete AS 
  ON DELETE TO audit_log 
  DO INSTEAD NOTHING;
```

**Why RULES (not triggers)?** RULES prevent the statement from even executing. Triggers could be bypassed by a careless admin. RULES are lower-level.

**Test that it works:**
```sql
-- This should silently fail (no error, no rows affected):
UPDATE audit_log SET action = 'HACKED' WHERE id = 1;
SELECT * FROM audit_log; -- Original data unchanged

-- This should fail too:
DELETE FROM audit_log WHERE id = 1;
```

---

## State Machine Definition

### Valid Transitions

```
DRAFT
  ↓ (applicant submits)
SUBMITTED
  ↓ (reviewer picks up)
UNDER_REVIEW
  ├→ CLARIFICATION_REQUESTED (reviewer asks for more docs)
  │   ↓ (applicant uploads)
  │   RESUBMITTED
  │   ↓ (goes back to review)
  │   UNDER_REVIEW
  │
  └→ DECISION_PENDING (reviewer completes review)
      ↓
      ├→ APPROVED (terminal)
      └→ REJECTED (terminal)
```

### Who Can Transition What

| From State | To State | Actor | Notes |
|---|---|---|---|
| DRAFT | SUBMITTED | APPLICANT | Owner submits |
| SUBMITTED | UNDER_REVIEW | REVIEWER | Reviewer accepts work |
| UNDER_REVIEW | CLARIFICATION_REQUESTED | REVIEWER | Request more docs |
| UNDER_REVIEW | DECISION_PENDING | REVIEWER | Review complete |
| CLARIFICATION_REQUESTED | RESUBMITTED | APPLICANT | Upload new docs |
| RESUBMITTED | UNDER_REVIEW | REVIEWER | Goes back to review |
| DECISION_PENDING | APPROVED | APPROVER | Final yes |
| DECISION_PENDING | REJECTED | APPROVER | Final no |

### Enforcement Rule: Reviewer ≠ Approver

**In code:**
```typescript
// Before APPROVER can approve, check:
const app = await Application.findOne(appId);
if (app.current_reviewer_id === approver_id) {
  throw new Error('Cannot approve own review');
}
```

**In database (optional additional constraint):**
```sql
-- Could add a check constraint, but app-level is sufficient
-- This is for documentation:
-- DECISION_PENDING state requires:
--   - current_approver_id ≠ current_reviewer_id
```

---

## Role Definitions

### APPLICANT
| Action | Allowed | Notes |
|---|---|---|
| Create application | ✅ | Own application only |
| Submit application | ✅ | Own application, DRAFT→SUBMITTED |
| Resubmit after clarification | ✅ | Own application |
| Upload documents | ✅ | Own application |
| View own applications | ✅ | Cannot see others |
| View other applications | ❌ | 403 Forbidden |

### REVIEWER
| Action | Allowed | Notes |
|---|---|---|
| Read all applications | ✅ | View, not edit |
| Accept application for review | ✅ | SUBMITTED→UNDER_REVIEW |
| Request clarification | ✅ | UNDER_REVIEW→CLARIFICATION_REQUESTED |
| Complete review | ✅ | UNDER_REVIEW→DECISION_PENDING |
| Provide feedback | ✅ | Stored in `reviewer_feedback` field |
| Approve/Reject | ❌ | APPROVER only |
| View audit log | ⚠️ | Own reviews only |

### APPROVER
| Action | Allowed | Notes |
|---|---|---|
| Read all applications | ✅ | View, not edit |
| Approve | ✅ | DECISION_PENDING→APPROVED, only if reviewer_id ≠ approver_id |
| Reject | ✅ | DECISION_PENDING→REJECTED, only if reviewer_id ≠ approver_id |
| Provide decision notes | ✅ | Stored in `decision_notes` field |
| Review applications | ❌ | Cannot transition to UNDER_REVIEW or provide feedback |
| View audit log | ❌ | Only ADMIN can |

### ADMIN
| Action | Allowed | Notes |
|---|---|---|
| View audit log (full) | ✅ | Read-only |
| View all applications | ✅ | Read-only |
| Modify applications | ❌ | Read-only role |
| Manage users | ⚠️ | Out of scope for 48h |

---

## API Response Codes (Strict)

| Code | When | Example |
|---|---|---|
| 200 | Success | GET application |
| 201 | Created | POST application |
| 400 | Invalid request (validation) | Missing field, invalid state transition |
| 401 | No token or invalid token | Missing Authorization header |
| 403 | Authenticated but not authorized | APPLICANT trying to approve |
| 404 | Resource not found | GET /applications/999 |
| 409 | Conflict (version mismatch, state already changed) | Two users updating simultaneously |
| 413 | File too large | Upload > 5MB |
| 500 | Server error | **Never return this in normal flow** |

### Key Rule: Never Return 404 for Authorization

**Wrong:**
```json
GET /applications/123 (you don't have access)
{ "error": "Not found" } // 404 ❌
```

**Right:**
```json
GET /applications/123 (you don't have access)
{ "error": "Forbidden" } // 403 ✅
```

Why? Because 404 doesn't tell the user whether the resource exists (security risk). Always be honest: "you can't see this" (403) vs "this doesn't exist" (404).

---

## Audit Log Structure

```json
{
  "id": 1,
  "user_id": 2,
  "application_id": 5,
  "action": "APPROVED",
  "before_state": "DECISION_PENDING",
  "after_state": "APPROVED",
  "details": {
    "decision_notes": "Application meets all requirements.",
    "approver_id": 3
  },
  "created_at": "2025-05-07T14:32:00Z"
}
```

### Actions Logged

- `APPLICATION_CREATED` (who created, institution name)
- `APPLICATION_SUBMITTED` (by whom)
- `REVIEW_STARTED` (reviewer assigned)
- `FEEDBACK_PROVIDED` (reviewer feedback text)
- `CLARIFICATION_REQUESTED` (what was requested)
- `RESUBMITTED` (new docs uploaded)
- `REVIEW_COMPLETED` (reviewer done)
- `APPROVED` (approver decision + notes)
- `REJECTED` (approver decision + notes)

---

## Document Versioning Strategy

### Scenario: Applicant Resubmits After Clarification

**Initial submission (v1):**
```
documents/
├── app-5/
│   ├── bank_registration.pdf (v1, size: 2.1MB, uploaded: 2025-05-07T10:00Z)
│   └── financial_statement.pdf (v1, size: 1.8MB, uploaded: 2025-05-07T10:00Z)
```

**After clarification request, applicant resubmits (v2):**
```
documents/
├── app-5/
│   ├── bank_registration.pdf
│   │   ├── v1 (size: 2.1MB, uploaded: 2025-05-07T10:00Z) — old
│   │   └── v2 (size: 2.2MB, uploaded: 2025-05-07T14:00Z) — new
│   └── financial_statement.pdf
│       ├── v1 (size: 1.8MB, uploaded: 2025-05-07T10:00Z)
│       └── v2 (size: 1.9MB, uploaded: 2025-05-07T14:00Z)
```

### Database Schema for Documents

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  file_size INT NOT NULL CHECK (file_size <= 5242880), -- 5MB
  mime_type VARCHAR(100),
  uploader_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Natural key: (application_id, filename, version)
  UNIQUE(application_id, filename, version)
);
```

### Implementation Notes

- On upload, check if file already exists for this app
- If yes → increment version
- If no → version = 1
- Store physical files as: `/data/files/{appId}/v{version}/{filename}`
- No manual deletion of old versions

---

## Concurrent Update Handling (Simple Optimistic Locking)

### Pattern: Version Column

Add `version INT DEFAULT 1` to applications table.

### Update Logic

```typescript
async function transitionApplication(
  appId: number,
  userId: number,
  newState: string,
  expectedVersion: number
) {
  const result = await db.query(
    `UPDATE applications 
     SET status = $1, version = version + 1, updated_at = NOW()
     WHERE id = $2 AND version = $3
     RETURNING *`,
    [newState, appId, expectedVersion]
  );
  
  if (result.rowCount === 0) {
    throw new ConflictError('Application was updated by another user');
  }
  
  return result.rows[0];
}
```

### User Flow

1. User A: `GET /applications/5` → sees version=3, status=UNDER_REVIEW
2. User B: `GET /applications/5` → sees version=3, status=UNDER_REVIEW
3. User B: `PUT /applications/5` with `{ status: DECISION_PENDING, version: 3 }` → succeeds, version=4
4. User A: `PUT /applications/5` with `{ status: CLARIFICATION_REQUESTED, version: 3 }` → **fails with 409 Conflict**
5. User A must refetch (version=4) before trying again

---

## Directory Structure

```
src/
├── entities/
│   ├── User.ts
│   ├── Application.ts
│   ├── Document.ts
│   └── AuditLog.ts
├── services/
│   ├── AuthService.ts
│   ├── AuthorizationService.ts
│   ├── StateMachine.ts
│   ├── AuditLogger.ts
│   └── __tests__/
│       ├── StateMachine.test.ts
│       ├── Authorization.test.ts
│       └── AuditLogger.test.ts
├── routes/
│   ├── auth.ts
│   ├── applications.ts
│   ├── documents.ts
│   ├── audit.ts
│   └── __tests__/
│       ├── concurrent.test.ts
│       └── integration.test.ts
├── middleware/
│   ├── authMiddleware.ts
│   ├── roleMiddleware.ts
│   └── errorHandler.ts
├── database/
│   └── migrations/
│       ├── 001_init.sql
│       └── 002_indexes.sql
└── server.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── ApplicationDetail.tsx
│   │   └── Nav.tsx
│   ├── services/
│   │   └── api.ts
│   └── App.tsx
└── public/

scripts/
├── seed.ts (users + one sample app)
└── seedApplications.ts (create 2 apps in different states)

docs/
├── EVALUATION_METRICS.md
├── DESIGN-DOCUMENT.md
├── KNOWLEDGE.md
├── TESTCASE.md
└── ESSENTIAL_FEATURES.md

SPRINT_48H.md (this ticket list)
TECH_STACK.md (this file)
README.md
openapi.yaml
```

---

## Development Checklist

- [ ] Database running locally (`createdb bank_licensing`)
- [ ] `.env` created from `.env.example`
- [ ] `npm install` completes
- [ ] `npm run migrate` succeeds (schema loaded)
- [ ] `npm run seed` creates users
- [ ] `npm start` starts server on :3000
- [ ] `npm test` runs all tests
- [ ] API docs available at `/api-docs`
- [ ] Frontend runs on :3000 (separate port if backend is :3000)
- [ ] Can login with seed credentials

---

## Performance Notes (Not Priority for 48h, But Document)

| Concern | Decision | Why |
|---|---|---|
| Database indexes | Add on foreign keys + status column | Queries will filter by status frequently |
| N+1 queries | Load reviewer/approver names eagerly | Small dataset; premature optimization is evil |
| Audit log size | Append-only; no cleanup | Legal liability of deleting logs |
| File storage | Local filesystem | Good enough for regulatory demo |
| Concurrent users | Optimistic locking; assume <10 simultaneous | Not a SaaS; internal tool |

---

## Deployment Notes (Out of Scope, But Document)

**For evaluators, assume:**
1. Single machine, local PostgreSQL
2. No Docker initially (adds setup complexity)
3. Node runs directly: `npm start`
4. Frontend served separately: `cd frontend && npm start`

**If you had more time:**
- Docker Compose (both services + DB)
- Nginx reverse proxy
- .env.production with real secrets

