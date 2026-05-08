# Evaluation Checklist: What Actually Gets Graded

This document maps the evaluation criteria (from EVALUATION_METRICS.md) to concrete deliverables. **Do not ship until all ✅ are completed.**

---

## 1. SYSTEM DESIGN (40% of grade — highest weight)

### Criterion: "Do your architectural decisions make sense for a high-stakes regulatory context?"

#### ✅ Must Have

- [ ] **Design Document** (`DESIGN-DOCUMENT.md` in repo root)
  - [ ] Architecture section: backend/DB/frontend components + why
  - [ ] Data model: exact schema for users, applications, documents, audit_log
  - [ ] State machine: all states, all valid transitions, rules (e.g., reviewer ≠ approver)
  - [ ] Roles: each role, what they can/cannot do, why boundaries drawn there
  - [ ] Hard decisions: for EACH non-negotiable requirement below, explain:
    - [ ] How your implementation satisfies it
    - [ ] What you'd do differently given more time

- [ ] **Audit Trail Design** (shows regulatory thinking)
  - [ ] Explained: why append-only? (tamper-proof for legal evidence)
  - [ ] Explained: how enforced at DB layer? (RULES, not just app logic)
  - [ ] Explained: what's in each audit entry? (user, action, before/after state, timestamp)
  - [ ] Documented: can audit log be queried by role? (ADMIN yes, others filtered)

- [ ] **Separation of Duties** (the ONE hard rule)
  - [ ] Documented: why you chose this enforcement point
  - [ ] Documented: where it's checked (code layer? DB constraint?)
  - [ ] Tested: reviewer CANNOT approve own review (explicit test)

- [ ] **State Machine Justification**
  - [ ] Documented: why these states? (not too few, not too many)
  - [ ] Documented: why these transitions? (justify CLARIFICATION_REQUESTED → RESUBMITTED)
  - [ ] Documented: why terminal states are final? (regulatory finality)

#### 🎯 Bonus (Separates Senior From Mid)

- [ ] Trade-offs explicitly discussed
  - Example: "We chose JWT over sessions because [X]. Trade-off: [Y] would be better for [Z] but we prioritized [A]."
  - Example: "Optimistic locking instead of distributed locks because [rationale]. Downside: [edge case we accepted]."

- [ ] Ambiguity handling documented
  - Example: "The spec didn't say when CLARIFICATION_REQUESTED happens. We chose [our rule] because [justification]. Alternative: [other approach] would be good if [scenario]."

---

## 2. CODE QUALITY (25% of grade)

### Criterion: "Would another engineer be able to work in this codebase?"

#### ✅ Must Have

- [ ] **Readability**
  - [ ] Variable names are descriptive (not `x`, `temp`, `data`)
  - [ ] Functions <20 lines (complex logic extracted)
  - [ ] No commented-out code blocks
  - [ ] No TODOs left in code (or justified TODOs with context)

- [ ] **Consistency**
  - [ ] Naming convention consistent (camelCase for vars, snake_case for DB columns)
  - [ ] Error handling pattern consistent (not some places throw, some return null)
  - [ ] Indentation consistent (not mixing tabs/spaces)

- [ ] **Maintainability**
  - [ ] State machine logic in one place (not scattered across 5 files)
  - [ ] Authorization checks in one place (decorator, middleware, service — pick one pattern)
  - [ ] No duplicate code (util functions extracted)

- [ ] **Type Safety** (if TypeScript)
  - [ ] No `any` types used (except rare justified cases)
  - [ ] All function parameters typed
  - [ ] API response types defined
  - [ ] Builds without warnings

#### 🎯 Bonus

- [ ] Well-organized imports (standard lib, third-party, local — in order)
- [ ] Constants defined once (no magic strings in multiple places)
- [ ] Database queries safe (parameterized, not string concatenation)

---

## 3. SECURITY & CORRECTNESS (25% of grade — critical)

### Criterion: "Is role enforcement solid? Is the audit trail tamper-proof? Concurrent access correct?"

#### ✅ MUST HAVE (Non-Negotiable)

- [ ] **Role Enforcement**
  - [ ] Backend checks role for EVERY action (not just UI hiding buttons)
  - [ ] Unauthorized request returns 403, not 404 or 500
  - [ ] Tested: APPLICANT cannot read other APPLICANT's apps (403)
  - [ ] Tested: REVIEWER cannot approve (returns 403)
  - [ ] Tested: APPROVER cannot review (returns 403)

- [ ] **Separation of Duties (CRITICAL HARD RULE)**
  - [ ] Code check: `current_reviewer_id ≠ approver_id` before APPROVER can approve
  - [ ] Tested explicitly: reviewer assigned to app X, cannot approve app X
  - [ ] If a user is both reviewer and approver role, still cannot review+approve same app

- [ ] **Audit Trail Immutability**
  - [ ] Audit log table cannot be updated (DB RULE prevents it)
  - [ ] Audit log table cannot be deleted (DB RULE prevents it)
  - [ ] Tested: attempt to UPDATE audit_log fails silently (or with constraint error)
  - [ ] Tested: attempt to DELETE audit_log fails
  - [ ] Every state transition logged to audit_log
  - [ ] Audit entries include: user, action, before_state, after_state, timestamp

- [ ] **Concurrent Access**
  - [ ] Two users updating same app doesn't create inconsistent state
  - [ ] Tested: User A and User B fetch app simultaneously, both try to update, second one gets 409 Conflict
  - [ ] Implementation: version column + WHERE version = expected_version
  - [ ] No race conditions in state machine (e.g., both approving + rejecting same app)

- [ ] **SQL Injection Prevention**
  - [ ] All queries parameterized (not string concatenation)
  - [ ] No raw SQL in controller logic

- [ ] **Authentication**
  - [ ] Password hashed (bcrypt, not plaintext, not SHA1)
  - [ ] JWT signed (not just base64)
  - [ ] Invalid password returns 401, not "user not found"
  - [ ] Token expiry enforced

#### 🎯 Bonus

- [ ] Hash chain for audit trail (each record includes hash of previous)
- [ ] Rate limiting on auth endpoints (prevent brute-force)
- [ ] HTTPS in production (document assumption for 48h scope)

---

## 4. TESTING (15% of grade)

### Criterion: "Do your tests cover the things that actually matter?"

#### ✅ MUST HAVE

- [ ] **State Machine Tests**
  - [ ] Test file: `src/services/__tests__/StateMachine.test.ts`
  - [ ] ✓ Valid transitions (20+ cases): DRAFT→SUBMITTED, UNDER_REVIEW→DECISION_PENDING, etc.
  - [ ] ✓ Invalid transitions: APPROVED→SUBMITTED (should fail), etc.
  - [ ] ✓ Edge cases: cannot transition to same state, cannot skip states
  - [ ] ✓ Role constraints: reviewer can move to CLARIFICATION_REQUESTED but not APPROVER

- [ ] **Authorization Tests**
  - [ ] Test file: `src/services/__tests__/Authorization.test.ts` (or `routes/__tests__/auth.test.ts`)
  - [ ] ✓ APPLICANT cannot read others' apps (403)
  - [ ] ✓ REVIEWER cannot approve (403)
  - [ ] ✓ APPROVER cannot review (403)
  - [ ] ✓ Reviewer ≠ approver on same app (403 if same user)
  - [ ] ✓ ADMIN can read audit log, others cannot

- [ ] **Concurrent Access Test**
  - [ ] Test file: `src/routes/__tests__/concurrent.test.ts` or integration test
  - [ ] ✓ Two users fetch app version=1
  - [ ] ✓ User B updates → version becomes 2
  - [ ] ✓ User A tries to update with version=1 → 409 Conflict
  - [ ] ✓ User A refetches, sees version=2

- [ ] **Integration Test (Happy Path)**
  - [ ] Test file: `src/__tests__/integration.test.ts`
  - [ ] ✓ Applicant creates app (DRAFT)
  - [ ] ✓ Applicant submits (SUBMITTED)
  - [ ] ✓ Reviewer reads app, requests clarification
  - [ ] ✓ Applicant resubmits docs
  - [ ] ✓ Reviewer completes review
  - [ ] ✓ Approver approves
  - [ ] ✓ Verify audit log captures all steps

- [ ] **Test Results**
  - [ ] All tests pass: `npm test` returns 0
  - [ ] Test output shows >15 test cases
  - [ ] Coverage report shows critical paths covered (no need for 100%)

#### 🎯 Bonus

- [ ] Document upload size limit enforced + tested
- [ ] Audit trail immutability tested
- [ ] JWT expiry tested

---

## 5. JUDGMENT UNDER AMBIGUITY (10% of grade)

### Criterion: "When requirements were vague, did you make a defensible call?"

#### ✅ Must Have (Documented in Design Document or README)

For each of these, the spec was intentionally vague:

- [ ] **What are the roles?**
  - Chosen: APPLICANT, REVIEWER, APPROVER, ADMIN
  - Documented: Why 4 roles? Why not 5? Why split reviewer/approver?

- [ ] **What states do applications go through?**
  - Chosen: DRAFT, SUBMITTED, UNDER_REVIEW, CLARIFICATION_REQUESTED, DECISION_PENDING, APPROVED, REJECTED
  - Documented: Why this state machine? Why not simpler? Why CLARIFICATION_REQUESTED as separate state?

- [ ] **When should CLARIFICATION_REQUESTED happen?**
  - Chosen: Reviewer can request after reading, app goes back to SUBMITTED (applicant resubmits)
  - Documented: Why this flow? What's the alternative?

- [ ] **How should documents be versioned?**
  - Chosen: On resubmit, new version of same file (v1, v2, v3)
  - Documented: Why keep old versions? Why not overwrite?

- [ ] **How is audit immutability enforced?**
  - Chosen: PostgreSQL RULES prevent UPDATE/DELETE at DB layer
  - Documented: Why DB-level? Why not just app-level checks?

#### 🎯 Bonus

- [ ] Mention what you'd do differently given more time
  - Example: "If we had 2 weeks, we'd add hash chaining to audit entries for cryptographic proof of tampering."
  - Example: "Given more time, roles would be more granular (INITIAL_REVIEWER vs FINAL_REVIEWER)."

---

## 6. COMMUNICATION (10% of grade)

### Criterion: "Can someone run this from your README and design doc alone?"

#### ✅ MUST HAVE

- [ ] **README.md** (in repo root)
  - [ ] Quick-start section (copy-paste commands):
    ```
    npm install
    createdb bank_licensing
    npm run migrate
    npm run seed
    npm start
    ```
  - [ ] Default user credentials (email/password for each role)
  - [ ] How to access frontend (port/URL)
  - [ ] How to access API docs
  - [ ] One paragraph explaining what the system does

- [ ] **DESIGN-DOCUMENT.md** (in repo root or `docs/`)
  - [ ] Covers all 5 sections:
    - [ ] Architecture (components, how they talk)
    - [ ] Data model (schema)
    - [ ] State machine (states + transitions)
    - [ ] Roles (each role + boundaries)
    - [ ] Hard decisions (how you satisfied each requirement)

- [ ] **API Documentation**
  - [ ] OpenAPI spec (YAML) or Postman collection in repo
  - [ ] All endpoints documented:
    ```
    POST /auth/signup
    POST /auth/login
    GET /auth/me
    POST /applications
    GET /applications
    GET /applications/:id
    PUT /applications/:id/transition
    PATCH /applications/:id/feedback
    PATCH /applications/:id/decide
    POST /applications/:id/documents
    GET /applications/:id/documents
    GET /audit
    ```
  - [ ] Request/response examples for each
  - [ ] Error codes documented (401, 403, 400, 409)

- [ ] **Seed Script Works**
  - [ ] `npm run seed` creates 4 users (one per role)
  - [ ] Evaluator can login immediately after seed
  - [ ] No database setup needed besides `createdb`

#### 🎯 Bonus

- [ ] Architecture diagram (ASCII or simple SVG)
- [ ] Screenshots of UI workflows
- [ ] Postman collection importable and ready to test

---

## 7. HARD REQUIREMENTS (Non-Negotiable)

### From ESSENTIAL_FEATURES.md — Every One Must Work

- [ ] **Separation of Duties**
  - [ ] Reviewer ≠ Approver on same application (enforced at API level)
  - [ ] Tested + works

- [ ] **State Machine**
  - [ ] Defined + documented
  - [ ] Illegal transitions rejected at API level (not UI)
  - [ ] Final decisions (APPROVED/REJECTED) permanent

- [ ] **Audit Trail**
  - [ ] Every action logged
  - [ ] Append-only (DB-level immutability)
  - [ ] No updates/deletes possible
  - [ ] Each entry: user, action, timestamp, before/after state

- [ ] **Role Enforcement**
  - [ ] Backend enforces (user who bypasses frontend still denied)
  - [ ] Unauthorized returns 403, not 404

- [ ] **Document Handling**
  - [ ] Upload supported (simulated storage)
  - [ ] 5MB limit enforced server-side
  - [ ] Metadata stored (name, size, type, uploader, timestamp)
  - [ ] Versioning supported (multiple uploads)

- [ ] **Concurrent Access**
  - [ ] Two users on same app handled without inconsistency
  - [ ] Tested explicitly

- [ ] **API**
  - [ ] Consistent + documented
  - [ ] No raw stack traces (proper error handling)
  - [ ] Seed scripts work
  - [ ] Proper HTTP codes

- [ ] **Frontend**
  - [ ] Functional web interface (internal tool, clarity > design)
  - [ ] Role-based UI (actions not visible to wrong roles)
  - [ ] Load/error/empty states handled

- [ ] **Testing**
  - [ ] State machine transitions tested
  - [ ] Authorization tested (each role + boundaries)
  - [ ] Concurrent access tested

---

## Pre-Submission Checklist

### 48 Hours Before Deadline

- [ ] All 21 tickets from `SPRINT_48H.md` marked as complete
- [ ] All tests passing: `npm test`
- [ ] Linting passes: `npm run lint` (if configured)
- [ ] Backend runs: `npm start`
- [ ] Frontend runs: `npm start` (in frontend/ directory)
- [ ] Seed script works: `npm run seed`
- [ ] Can login with all 4 seed users
- [ ] Can complete happy path (applicant → reviewer → approver → approved)

### 12 Hours Before Deadline

- [ ] README tested (can someone run system following it?)
- [ ] Design Document complete (covers all 5 sections)
- [ ] API docs complete (all endpoints documented)
- [ ] Test output saved (show coverage)
- [ ] No console errors/warnings in browser
- [ ] No SQL errors in server logs
- [ ] Separation of duties tested (reviewer ≠ approver verification)
- [ ] Audit log verified (append-only, immutable)

### Final Review (2 Hours Before)

- [ ] Read README out loud (does it make sense?)
- [ ] Read Design Document (is it coherent?)
- [ ] Run tests one more time: `npm test`
- [ ] Make sure `.git` is clean (no uncommitted changes left)
- [ ] Check that sensitive files (.env with real secrets) are in `.gitignore`
- [ ] Verify evaluator can clone, install, seed, run without asking questions

---

## Grade Mapping (Rough)

| Score | What It Means |
|---|---|
| **90-100** | Shipping production-quality system. Design is thoughtful. Code is clean. All tests pass. Communication is excellent. Evidence of senior-level thinking. |
| **80-89** | Shipping solid working system. Design is sound. Code is good. Tests cover main paths. Some explanation could be clearer, but clearly competent. |
| **70-79** | Shipping working system. Design exists but lacks depth. Code works but could be cleaner. Tests are there but sparse. Shows mid-level competence. |
| **<70** | Incomplete, broken, or major gaps. Missing design docs, failing tests, security issues, or requirements not met. |

**Your goal**: Hit 90+. This means:
1. **All hard requirements working** (non-negotiable)
2. **Design document that shows thinking** (not just describing code)
3. **Clean code** (another engineer can work here)
4. **Tests that matter** (state machine, auth, concurrent, happy path)
5. **Clear communication** (README + docs + code)

---

## How to Use This

**Each time you complete a ticket**, update this checklist:
1. Read the ✅ for that feature area
2. Verify each ✅ is actually true (not just "I wrote the code")
3. Test it in browser/Postman
4. Check the box

**At the end of 48h**, this checklist should be 100% complete. If not:
- Identify what's missing
- Decide: cut scope (remove feature) or extend (slip timeline)
- **Better to ship fewer features done correctly than many features half-baked**

