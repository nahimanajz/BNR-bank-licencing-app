# BNR Bank Licensing Portal — Design Document

---

## Architecture

Backend is an Express API connected to PostgreSQL. Frontend is Next.js. They only share the REST API endpoints.

```
Browser (Next.js)  ──HTTP/JSON──►  Express API  ──►  PostgreSQL
```

**Backend** 
- On this architecture I used repository design pattern [documentation](https://medium.com/@pererikbergman/repository-design-pattern-e28c0f3e4a30)
— A request arrives in middleware for checks, if passed it goes to controller to handle HTTP requests then call service which deals with business logic thereby a repository is called to handle read/write operation to actual database and on this project I used POSTGRES.

- There two entry point in this app `server.ts` which deals with `app.listen()` to bootstrap actual application.
- The second one is `app.ts` which is there for enabling tests of this backend app.

Auth is simple: `authMiddleware` pulls the JWT from the `Authorization` header, verifies it, and puts `{ id, email, role }` on `req.user`. Then `requireRole()` checks the role before the controller runs. 

### Tools
- Postgress and Sequelize
- Express
- Supertest
- Jest
- Typescript
- ES6
**Frontend** 
On this frontend architecture I used service oriented architecture, where a request initiates from `view/page` page which is set of called `components/` passes/retrieve data from/to  reusable `hook/`  method which uses `tanstack query` that calls `services/` that does api query in, doing so, services use axios interceptor, there are addional files in utils that handles task like formatting dates and perform other side effects, all of these are done in other to emphasis single responsibility for every code written in this frontend project.

A user (Applicant, Reviewer or Approver) signup/login the lands to dash board, to see list of applications then perform apply, review, or approve depends on who. all or these data are cached using react query.
Additionally, signed user are saved in browser `localstorage` and it gets cleared as user presses logout buttons.


### Tools
- Typescript
- Tanstack react query
- NextJS
- 


```
Page (Next.js route)
    │
    ▼
View component  — layout only
    │
    ▼
React Query hook  — loading/error/data
    │
    ▼
Service module  — axios calls
    │
    ▼
Express API
```

REST over GraphQL — the resource model is simple. Applications, documents, audit entries map cleanly to GET/POST/PATCH. GraphQL would've been extra complexity for no real benefit here.

PostgreSQL — the audit trail needs reliable writes. ACID guarantees matter. Optimistic locking with `UPDATE WHERE version = ?` works out of the box. A document store would mean rebuilding all of that myself.

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

`current_reviewer_id` is how the reviewer ≠ approver rule works. When a reviewer claims an application, their ID is stored here. Before any approval, the service checks that the caller's ID doesn't match.

### documents

| Column         | Type         | Notes                                       |
|----------------|--------------|---------------------------------------------|
| id             | INTEGER PK   |                                             |
| application_id | INTEGER FK   | → applications.id                           |
| filename       | VARCHAR(255) | uuid-prefixed name on disk                  |
| original_name  | VARCHAR(255) | what the user uploaded                      |
| file_size      | INTEGER      | bytes — max 5 MB enforced server-side       |
| mime_type      | VARCHAR(100) |                                             |
| uploader_id    | INTEGER FK   | → users.id                                  |
| version        | INTEGER      | increments per resubmission cycle           |
| created_at     | TIMESTAMP    |                                             |
| updated_at     | TIMESTAMP    |                                             |

Documents are never deleted. On resubmission, new files get version N+1 and the old ones stay. Reviewers can always see what was submitted before.

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

No `updated_at` — audit records are written once and never changed.

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

APPROVED and REJECTED are terminal — no outgoing transitions. `StateMachineService.validateTransition()` checks both the graph and the role in one place. Anything illegal throws before the database is touched.

`CLARIFICATION_REQUESTED` is a real state, not just a flag. It formally pauses the application — no reviewer can push it to `DECISION_PENDING` while the applicant is still preparing their response. It also keeps the audit trail clean.

Validation order: state machine check runs first, version check second. A bad transition returns 400 right away. A 409 only shows up when the transition is valid but the row already moved.

---

## Roles

**APPLICANT**

Can: create applications, submit them, upload documents, and view their own applications only that

**REVIEWER**

Can: view all applications, claim submitted ones, request clarification, forward to decision, read the audit trail.

**APPROVER**

Can: make the final APPROVED or REJECTED call on applications in DECISION_PENDING, read the audit trail.

Both REVIEWER and APPROVER can read the audit logs because they are interact with application with admistrative privelidges that Applicant doesn't have.

---

## Hard Decisions

### Role Enforcement

Every protected endpoint runs `requireRole()` before the controller. The role comes from the JWT payload — it was set at login or signup and can't be changed without breaking the signature. No token → 401. Wrong role → 403. Neither leaks a 404 or 500.

The UI mirrors the backend rules, but the backend doesn't trust the UI. A REVIEWER hitting `PATCH /applications/:id/decide` directly still gets a 403.


### State Machine Enforcement

All transitions go through `StateMachineService.validateTransition()` before any write. The service has two maps — valid graph edges, and which roles can use each edge. If either check fails, it throws before the repository is called.

`PATCH /applications/:id/transition` is the only way to move an application. There's no backdoor — no field on create sets a non-DRAFT status, no override skips the check.

### Authentication

I chose to use JWT over session-based because sessions need a store like database table or redis unlike Json web token which keeps token with signature and expires based on time set,ex:`1h` for one hour, `1d` for one day etc.
Even though JWT cannot be revoked unless time expires, it is verified on backend local and the backend.

### Reviewer ≠ Approver

Two layers. The frontend shows a conflict-of-interest notice — buttons don't just silently disappear. The backend checks `current_reviewer_id` in `AuthorizationService.canApprove()` and throws 403 if it matches the caller. Bypassing the frontend doesn't help.

### Concurrent Access

Every application row has a `version` integer. Every write does:

```sql
UPDATE applications SET ..., version = version + 1
WHERE id = ? AND version = ?
```

If `rowsUpdated === 0`, someone else already changed it. We return 409 and the client reloads. No row locking, no deadlocks. The `concurrent.test.ts` test fires two requests at the same version and checks for exactly one 200 and one 409.

### Audit Trail

Every state-changing method in `ApplicationService` calls `AuditService.log()` before returning. It records who acted, what they did, before/after states, and extra details in a JSONB column.

`AuditLogRepository` In order the inherited `update()` to throw unconditionally — nothing in the API can edit an audit record. The limitation is that someone with direct database access can still run `DELETE` in psql. The proper fix is a PostgreSQL row-security policy that removes `UPDATE` and `DELETE` for the app's database role. I'd add that before using this log as legal evidence.

### Documents

Size of File  is checked in `DocumentService.upload()` before any database write — over 5 MB gets a 400 immediately. Files go to a local `data/files/` directory for now. In production, swap that for S3 and store the object key in `filename` — the service interface stays the same.

---

## Improvement Areas

- **Token revocation** — short-lived JWTs with refresh tokens and a logout blocklist. Right now a token lives until it reaches expiration time, which is a problem if you need to suspend an account while still conducting review.
- **Audit immutability at the database level** — a PostgreSQL row-security policy instead of just the code-level guard.
- **Admin role** — At the moment we have two adminstrative roles reviewer and approver but I'd consider to add another admin role which can delete, add, or change priveleges of those two roles.
- **Pagination** — `/applications` and `/audit` return everything. Fine at seed scale, not in production because it could be wrong UI&Ux and performance wise.
- **File storage** — local disk works for a demo. S3 or equivalent for production.
- **Email notifications** — Applicant should be notified via email, instead of manually logging in the sytem only to see the status of his application.
- **Dedicated test database** — tests run `sequelize.sync({ force: true })` against whatever is in `.env`. A separate `TEST_DATABASE_URL` would stop tests from wiping development data.
