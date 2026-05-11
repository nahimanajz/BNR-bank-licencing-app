# BNR Bank Licensing Portal

A regulatory portal for Rwanda's National Bank to manage commercial bank licensing applications end-to-end — from submission through review, clarification, and final approval.

The design document is at [`DESIGN-DOCUMENT.md`](DESIGN-DOCUMENT.md). It covers the architecture, data model, state machine, role boundaries, and the reasoning behind every hard decision.

---

## Running the application

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- PgAdmin is nice too have

### Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE environment variables and JWT_SECRET
npm install
createdb bank_licensing
npm run migrate             # runs Sequelize migrations
npm run seed                # creates seed users and sample applications
npm run dev                 # starts the server on http://localhost:4000
```

API documentation (Swagger UI) is available at **http://localhost:4000/api-docs** once the server is running.

### Frontend

```bash
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                 # starts the app on http://localhost:3000
```

### Seed credentials

| Role      | Email               | Password    |
|-----------|---------------------|-------------|
| APPLICANT | applicant@bnr.rw    | password123 |
| REVIEWER  | reviewer@bnr.rw     | password123 |
| APPROVER  | approver@bnr.rw     | password123 |

The seed also creates four applications in different states ( 'DRAFT','SUBMITTED','UNDER_REVIEW','CLARIFICATION_REQUESTED','RESUBMITTED','DECISION_PENDING','APPROVED','REJECTED') so you can explore the full workflow without manual setup.

---

## Running the tests

All tests are in `backend/tests/`. Run them from the backend directory:

```bash
cd backend
npm test                    # all tests
npm run test:unit           # unit tests only
npm run test:integration    # integration tests only
```

The integration tests run against a real PostgreSQL database. Before each suite, `sequelize.sync({ force: true })` drops and recreates all tables so the schema starts clean. Make sure your `.env` database credentials are set before running. The tests spin up the real Express app via `supertest` and hit actual HTTP endpoints — the database layer is not mocked.

### What the tests cover

**Unit — `tests/unit/StateMachine.test.ts`**
Tests `StateMachineService` in isolation. Covers every valid transition, every invalid transition (wrong state, skipping steps), every wrong-role combination, and terminal state enforcement. If the state machine regresses, this suite will tell you exactly which edge broke.

**Unit — `tests/unit/Authorization.test.ts`**
Tests `AuthorizationService` with a mocked repository. Asserts that a reviewer cannot approve their own application, an approver cannot review what they will decide, and that both guards pass cleanly when there is no conflict.

**Integration — `tests/integration/auth.test.ts`**
Covers signup (duplicate email → 409, invalid role → 400), login (wrong password → 401, unknown email → 401), and token validation on protected routes.

**Integration — `tests/integration/applications.test.ts`**
Walks a full application lifecycle — DRAFT through APPROVED — using real HTTP requests with real tokens. Also asserts role violations: a REVIEWER trying to create an application gets 403, an APPLICANT trying to move another user's application gets blocked.

**Integration — `tests/integration/concurrent.test.ts`**
Explicitly tests the concurrent access requirement. Two PATCH requests are fired simultaneously against the same application at the same `version`. The test asserts that exactly one returns 200 and the other returns 409. A second test confirms that a deliberately stale version is always rejected, even without a race condition.

---



