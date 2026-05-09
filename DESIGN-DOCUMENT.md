# BNR Bank Licensing Portal — Design Document

---

## Architecture

The backend is a layered Express API sitting in front of a PostgreSQL database. The frontend is a Next.js app that talks to it over HTTP. They share nothing except the API contract.

```
Browser (Next.js)  ──HTTP/JSON──►  Express API  ──►  PostgreSQL
```

**Backend** — requests pass through middleware (auth, role enforcement, validation), hit a controller that does nothing but parse and delegate, then reach a service where all business logic lives, and finally a repository that owns every database call. Controllers never touch the database; services never read HTTP headers. The layering keeps tests small and makes it obvious where a bug belongs.

One deliberate structural choice: the Express application is created in `app.ts` and exported without starting a server. The actual `listen()` call and database connection live in `server.ts`, which is the production entry point only. This matters because the integration tests import `app` directly and hand it to `supertest` — if `listen()` lived inside `app.ts`, every test run would bind a real TCP port. Keeping them separate means tests spin up in milliseconds with no port conflicts.

On the authentication side, every protected request goes through the same path: the `authMiddleware` extracts the JWT from the `Authorization` header, verifies it against `JWT_SECRET`, and attaches the decoded payload (`id`, `email`, `role`) to `req.user`. After that, `requireRole()` checks the role before the controller ever runs. A missing token returns 401. A valid token with the wrong role returns 403. Neither case leaks a 404 or a 500.

**Frontend** — built on Next.js App Router with React Query handling all server state. Every API call goes through a typed service module; components never call `fetch` directly. The auth token lives in `localStorage` and is attached by an Axios interceptor on every request. The `AuthContext` holds the current user and gates protected routes — if there's no user, the layout redirects to `/login` before rendering anything. Role-based visibility (which buttons show, which nav links appear) is derived from `user.role` at the component level, but the backend enforces the same rules independently.

```
Page (Next.js route)
    │
    ▼
View component  — layout and composition only
    │
    ▼
React Query hook  — owns loading/error/data states
    │
    ▼
Service module  — typed axios calls
    │
    ▼
Express API
```

I chose REST over GraphQL because the resource model here is simple and stable. Licensing applications, documents, audit entries — these map cleanly to GET/POST/PATCH on named URLs. GraphQL's flexibility would be overhead without any payoff.

PostgreSQL was the only real choice. The audit trail needs durable, queryable writes — ACID guarantees that a committed insert stays committed. The optimistic locking mechanism depends on an atomic `UPDATE WHERE version = ?`, which a relational database gives you for free. A document store would require rebuilding those guarantees from scratch.

---

## Data Model

### users

| Column        | Type         | Notes                         |
|---------------|--------------|-------------------------------|
| id            | INTEGER PK   |                               |
| email         | VARCHAR(255) | unique                        |
| password_hash | VARCHAR(255) | bcrypt, cost factor 10        |
| role          | ENUM         | APPLICANT, REVIEWER, APPROVER |
| full_name     | VARCHAR(255) | nullable                      |
| created_at    | TIMESTAMP    |                               |
| updated_at    | TIMESTAMP    |                               |

### applications

| Column              | Type         | Notes                                    |
|---------------------|--------------|------------------------------------------|
| id                  | INTEGER PK   |                                          |
| applicant_id        | INTEGER FK   | → users.id                               |
| institution_name    | VARCHAR(255) |                                          |
| status              | ENUM         | see state machine                        |
| current_reviewer_id | INTEGER FK   | → users.id, nullable                     |
| current_approver_id | INTEGER FK   | → users.id, nullable                     |
| reviewer_feedback   | TEXT         | populated on CLARIFICATION_REQUESTED     |
| decision_notes      | TEXT         | populated on APPROVED / REJECTED         |
| version             | INTEGER      | optimistic concurrency control           |
| created_at          | TIMESTAMP    |                                          |
| updated_at          | TIMESTAMP    |                                          |

`current_reviewer_id` is the field that enforces the reviewer ≠ approver rule. When a reviewer claims an application, their ID is written there. Before any approval, `AuthorizationService.canApprove()` checks that the caller's ID is not that value.

### documents

| Column         | Type         | Notes                                       |
|----------------|--------------|---------------------------------------------|
| id             | INTEGER PK   |                                             |
| application_id | INTEGER FK   | → applications.id                           |
| filename       | VARCHAR(255) | uuid-prefixed name on disk                  |
| original_name  | VARCHAR(255) | what the user actually uploaded             |
| file_size      | INTEGER      | bytes — enforced ≤ 5 MB server-side         |
| mime_type      | VARCHAR(100) |                                             |
| uploader_id    | INTEGER FK   | → users.id                                  |
| version        | INTEGER      | increments per resubmission cycle           |
| created_at     | TIMESTAMP    |                                             |
| updated_at     | TIMESTAMP    |                                             |

Documents are never deleted. On resubmission, new documents get version N+1; the originals stay at N. That way a reviewer can always see what was submitted before any clarification cycle.

### audit_log

| Column         | Type         | Notes                                |
|----------------|--------------|--------------------------------------|
| id             | INTEGER PK   |                                      |
| user_id        | INTEGER FK   | who acted                            |
| application_id | INTEGER FK   | on which application                 |
| action         | VARCHAR(100) | e.g. CREATED, SUBMITTED, APPROVED    |
| before_state   | VARCHAR(50)  | null on creation                     |
| after_state    | VARCHAR(50)  |                                      |
| details        | JSONB        | feedback text, decision notes, etc.  |
| created_at     | TIMESTAMP    |                                      |

No `updated_at` on audit_log. Records are created once and never touched again.

---

## State Machine

An application moves through eight states:

```
DRAFT ──────────────────────────────► SUBMITTED
                                          │
                                          ▼
                                      UNDER_REVIEW ◄───────────────┐
                                          │                         │
                              ┌───────────┴────────────┐            │
                              ▼                         ▼            │
                  CLARIFICATION_REQUESTED       DECISION_PENDING     │
                              │                         │            │
                              ▼                         ├─► APPROVED │
                         RESUBMITTED                    └─► REJECTED │
                              └─────────────────────────────────────►┘
```

Each transition is role-gated:

| From                    | To                      | Role      | Data written                          |
|-------------------------|-------------------------|-----------|---------------------------------------|
| DRAFT                   | SUBMITTED               | APPLICANT | —                                     |
| SUBMITTED               | UNDER_REVIEW            | REVIEWER  | `current_reviewer_id` set to caller   |
| UNDER_REVIEW            | CLARIFICATION_REQUESTED | REVIEWER  | `reviewer_feedback` set               |
| UNDER_REVIEW            | DECISION_PENDING        | REVIEWER  | —                                     |
| CLARIFICATION_REQUESTED | RESUBMITTED             | APPLICANT | —                                     |
| RESUBMITTED             | UNDER_REVIEW            | REVIEWER  | `current_reviewer_id` updated         |
| DECISION_PENDING        | APPROVED                | APPROVER  | `decision_notes`, `current_approver_id` set |
| DECISION_PENDING        | REJECTED                | APPROVER  | `decision_notes`, `current_approver_id` set |

APPROVED and REJECTED are terminal. `StateMachineService.validateTransition()` holds both the graph check and the role check in one place. Any illegal call — wrong state, wrong role, trying to exit a terminal — throws before anything touches the database. There is no special handling for terminal states; they simply have no outgoing edges in the map.

**Why `CLARIFICATION_REQUESTED` is a distinct state rather than just sending a message:** keeping it as an explicit state means the application is formally paused — no reviewer can accidentally move it to `DECISION_PENDING` while the applicant is preparing their response. It also means the audit log records a clean before/after state for the pause, which matters for a regulatory trail. The alternative (staying in `UNDER_REVIEW` and just flagging it) would blur the audit record and create ambiguity about whether the reviewer finished their work.

**Enforcement order matters:** the state machine validates the transition before the version check runs. An illegal transition returns 400 immediately; the 409 conflict response only surfaces when the transition itself is valid but the row has already moved on. This ordering prevents misleading error messages.

---

## Roles

**APPLICANT**

Can: create applications, submit them (DRAFT → SUBMITTED), upload documents, respond to clarification requests (CLARIFICATION_REQUESTED → RESUBMITTED), view their own applications and documents.

Cannot: read any other applicant's application, access the audit log, perform any reviewer or approver transitions, view the internal review state.

They see only their own data by design. The regulator's internal workflow — who reviewed it, what notes were written — is none of the applicant's business, which mirrors how a real licensing portal works.

**REVIEWER**

Can: view all applications regardless of applicant, claim submitted applications (SUBMITTED → UNDER_REVIEW), request clarification from the applicant, forward to decision (UNDER_REVIEW → DECISION_PENDING), read the full audit trail.

Cannot: create applications, make final approval or rejection decisions, approve an application on which they are the recorded reviewer.

The reason to separate review from approval is a four-eyes principle: the person who does the technical due diligence should not be the same person who signs off. Mixing the two in one role removes the accountability structure the challenge requires.

**APPROVER**

Can: make the final APPROVED or REJECTED call on applications in DECISION_PENDING, read the full audit trail.

Cannot: create applications, perform any review-stage transitions (SUBMITTED → UNDER_REVIEW, UNDER_REVIEW → DECISION_PENDING), approve an application they personally reviewed — that check runs in the service layer against the database, not just the UI.

Both REVIEWER and APPROVER can read the audit log because both roles are internal to the regulator and need the full history to do their job. APPLICANTs cannot — they see only what concerns them.

---

## Hard Decisions

### Role Enforcement

Every protected endpoint runs `requireRole()` middleware before the controller executes. The middleware reads the role from the JWT payload (which was written at login and cannot be altered without invalidating the signature). An unauthenticated request gets 401. A valid token with the wrong role gets 403. Neither case returns 404 or 500, which would leak information about whether the resource exists.

Role checks in the UI mirror the backend rules, but the backend enforces them regardless. A REVIEWER who removes the frontend entirely and hits `PATCH /applications/:id/decide` directly still gets a 403 from `requireRole('APPROVER')`. Given more time I'd add rate limiting on these endpoints so a bad actor probing for role mismatches can't do it indefinitely.

### State Machine Enforcement

Every state transition goes through `StateMachineService.validateTransition(currentState, nextState, role)` before any database write. The service holds two maps: one for valid graph edges (which state can follow which), and one for which roles can trigger each edge. If either check fails, it throws before the repository is called — the database never sees an illegal transition.

The `PATCH /applications/:id/transition` endpoint is the only way to move an application through the workflow. There is no backdoor: no field on the create endpoint sets a non-DRAFT status, no admin override skips the check. Given more time I'd add a database-level constraint (a CHECK or trigger) as a second layer, so even direct SQL access can't produce an illegal state combination.

### Authentication

I used JWTs rather than sessions. The main reason is that sessions require a shared store (Redis or a database table) the moment you run more than one server process. JWTs are verified locally against the secret, so the backend stays stateless. The real cost is revocation: a valid token stays valid until it expires. In production I'd shorten the TTL to 15 minutes and add a refresh-token flow with a blocklist on logout. For a regulatory internal tool, that trade-off is acceptable for a 48-hour build, but not for production.

### Reviewer ≠ Approver

This rule has two layers. The frontend shows an explicit conflict-of-interest notice when a reviewer visits an application they reviewed in an approver session — buttons don't just disappear silently. The backend enforces it in `AuthorizationService.canApprove()`, which reads `current_reviewer_id` from the database and throws a 403 if it matches the caller. A reviewer who circumvents the frontend entirely and hits the API directly is still blocked.

### Concurrent Access

Every application row carries a `version` integer. Every write goes through:

```sql
UPDATE applications SET ..., version = version + 1
WHERE id = ? AND version = ?
```

If nothing was updated (`rowsUpdated === 0`), someone else got there first and the version has already moved. We return 409 with a clear message. The client reloads and retries with the new version. No row locking, no deadlock risk, no overhead on uncontested writes. The `concurrent.test.ts` integration test fires two simultaneous requests at the same version and asserts exactly one 200 and one 409.

### Audit Trail

Every state-changing method in `ApplicationService` calls `AuditService.log()` before returning. The log captures who acted, what they did, the before and after states, and any relevant details (feedback text, decision notes) in a JSONB column.

The append-only guarantee is enforced at the code level: `AuditLogRepository` overrides the `update()` method it inherits from `BaseRepository` to throw unconditionally. No API endpoint exposes a delete or update on audit records. The honest limitation here is that a developer with direct database access can still run `DELETE` in psql. The production fix would be a PostgreSQL row-security policy that revokes `UPDATE` and `DELETE` on `audit_log` for the application's database role — making mutation structurally impossible, not just conventionally avoided. I'd do that before treating this log as legal evidence.

### Documents

File size is checked in `DocumentService.upload()` before any database write — if the file exceeds 5 MB it gets a 400 immediately. Files land in a local `uploads/` directory for this implementation. In production you'd swap that for S3 and store the object key in the `filename` column; the service interface wouldn't change.

---

## What I'd Do Differently With More Time

- **Token revocation** — short-lived JWTs with refresh tokens and a blocklist on logout. The current tokens live until expiry, which is fine for a demo but not for a system where a reviewer's account might be suspended mid-process.
- **Database-level audit immutability** — PostgreSQL row-security policy as described above. The code-level guard is a reasonable start but not a production guarantee.
- **Admin role** — a user who can grant or revoke REVIEWER and APPROVER access without touching the database directly. Currently role assignment happens at signup, which means there's no way to suspend a compromised account through the UI.
- **Pagination** — both `/applications` and `/audit` return full result sets. That works at seed-data scale; it won't survive production volume.
- **File storage** — local disk is fine for evaluation. An S3-compatible store is the obvious production path.
- **Email notifications** — the applicant has no way to know their status changed unless they log in and check. A simple status-change email would close that gap.
- **Test coverage** — the current suite covers the state machine, authorization guards, concurrent access, and the auth flow. Missing: document upload edge cases, the full clarification cycle end-to-end, and rate-limit behavior on auth endpoints.
- **Dedicated test database** — integration tests currently run `sequelize.sync({ force: true })` against the same database configured in `.env`, which drops and recreates all tables. In a real project I'd add a `TEST_DATABASE_URL` environment variable and a Jest global setup that points Sequelize at a separate database, so running tests never touches development data.
