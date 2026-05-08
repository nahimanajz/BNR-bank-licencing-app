# 🚀 48-Hour Sprint: Bank Licensing Portal

**Read this first. Then follow SPRINT_48H.md in order.**

---

## What You're Building

A Bank Licensing & Compliance Portal for Rwanda's national bank regulator. Think: replacing email/spreadsheets with a formal application workflow.

**Key constraint**: Everything must be correct and auditable. This is regulatory software — "it kinda works" is failure.

---

## What You're Being Evaluated On

**Evaluation Rubric (From EVALUATION_METRICS.md):**

| What We Look At | What We Want | Weight |
|---|---|---|
| **System design** | Decisions make sense for high-stakes regulatory context. You acknowledge trade-offs. | 40% |
| **Code quality** | Clean, readable, maintainable. Another engineer can work here. | 25% |
| **Security & correctness** | Role enforcement solid. Audit trail tamper-proof. Concurrent access handled. | 25% |
| **Testing** | Tests cover things that actually matter (state machine, security, failure cases). | 15% |

**Bonus points** if your design document shows thinking on trade-offs, not just descriptions of code.

---

## The Three Non-Negotiable Rules

1. **Separation of Duties** — The person who reviews an app cannot approve it. Enforced at backend.
2. **Immutable Audit Log** — Every action logged, nothing ever deleted. Enforced at database layer.
3. **Role Enforcement at Backend** — A user who bypasses the frontend must still be denied.

If any of these three fail, you fail the evaluation.

---

## Realistic 48-Hour Scope

### What Ships ✅
- JWT authentication + 3 roles (APPLICANT, REVIEWER, APPROVER)
- 5-state workflow (DRAFT → SUBMITTED → UNDER_REVIEW → DECISION_PENDING → APPROVED/REJECTED)
- Append-only audit log
- Document upload + basic versioning
- Comprehensive testing (state machine, authorization, concurrent access)
- Working web UI (all roles)
- API documentation + seed scripts

### What Doesn't ❌
- Hash chain for audit (nice but time-expensive)
- Advanced search/filters
- Email notifications
- User management UI
- Production deployment

**Better to ship 80% perfect than 100% mediocre.**

---

## Your Game Plan

### Phase 0: Setup (15 min, do this NOW)
1. Read `SPRINT_48H.md` (overview, understand all 21 tickets)
2. Read `TECH_STACK.md` (schema, role definitions, API codes)
3. Skim `EVALUATION_CHECKLIST.md` (know what gets graded)

### Phase 1: Foundation (6 hours)
- TICKET-001 through TICKET-003: Project setup, database schema, ORM entities
- Goal: `npm start` runs without errors

### Phase 2: Auth (5 hours)
- TICKET-004 through TICKET-006: JWT, RBAC, seed users
- Goal: Can login with 4 test users

### Phase 3: Business Logic (8 hours)
- TICKET-007 through TICKET-009: State machine, application CRUD, document upload
- Goal: Full applicant → reviewer → approver workflow works

### Phase 4: Audit (3 hours)
- TICKET-010 through TICKET-011: Append-only logging
- Goal: Every action captured, database prevents deletion

### Phase 5: Testing (6 hours)
- TICKET-012 through TICKET-015: Unit + integration tests
- Goal: `npm test` passes, 20+ critical tests

### Phase 6: Frontend (6 hours)
- TICKET-016 through TICKET-018: React UI for all roles
- Goal: Can see app, click buttons, workflows work

### Phase 7: Polish (3 hours)
- TICKET-019 through TICKET-021: API docs, seed data, README
- Goal: Evaluator can clone, install, run in <10 min

### Phase 8: Verification (Buffer)
- Run through checklist in EVALUATION_CHECKLIST.md
- Fix any gaps
- Delete this file 😄

---

## How to Know You're On Track

### End of Hour 6
- [ ] Backend runs locally
- [ ] Database schema loaded
- [ ] Can see users in DB

### End of Hour 11
- [ ] Can login with test user
- [ ] JWT works
- [ ] Role checks returning 403

### End of Hour 19
- [ ] Can create application
- [ ] Can change application state
- [ ] State machine rejects invalid transitions

### End of Hour 25
- [ ] Audit log captures actions
- [ ] DB prevents audit deletion
- [ ] Tests passing

### End of Hour 31
- [ ] Tests pass (state machine, auth, concurrent)
- [ ] Test output shows 20+ cases

### End of Hour 37
- [ ] Can login + see dashboard
- [ ] Can click through workflow in browser

### End of Hour 40
- [ ] API docs complete
- [ ] Seed script works
- [ ] README works

### End of Hour 48
- [ ] All checklist items in EVALUATION_CHECKLIST.md marked ✅
- [ ] System runs end-to-end
- [ ] Evaluator can clone → install → seed → run

---

## Critical Success Factors

### 1. Correctness Over Features
- A broken "complete" system scores <50
- A perfect core scores >80
- Ship the happy path flawlessly, skip nice-to-haves

### 2. Enforcement at Backend
- Don't trust the frontend
- Every authorization check at API level
- Test by calling API with `curl`, not just UI buttons

### 3. Immutable Audit Trail
- Not "we never delete it in code"
- DB-level: RULES or constraints that prevent deletion
- Testable: `UPDATE audit_log SET ...` should fail

### 4. Separation of Duties Is Hard
- You need to track: `application.current_reviewer_id` and `application.current_approver_id`
- Before approver can approve: check they're not the reviewer
- Test: create app, reviewer reads it, then as that reviewer try to approve (should fail 403)

### 5. Testing Matters More Than Coverage %
- Don't aim for 100% coverage
- Aim for 100% of business-critical paths
- State machine: every transition
- Auth: every role boundary violation
- Concurrent: race condition scenario

---

## Pitfalls to Avoid

| Pitfall | Why It Kills You | How to Avoid |
|---|---|---|
| Trying to be clever | Code gets hard to test and maintain | Just write the straightforward solution |
| Frontend enforcement only | Someone bypasses UI, accesses API directly, gets data they shouldn't | Middleware + test it with `curl` |
| Audit trail deletes "old records" | Evaluator catches you deleting audit entries, instant fail | DB RULE prevents it, show the test |
| Weak state machine | "Somehow the state got to APPROVED without a reviewer" | Test every transition, both valid and invalid |
| Reviewer = Approver on same app | That's the one hard rule, don't mess it up | Explicit test: same user = 403 |
| No seed script | Evaluator has to manually set up 4 users, loses patience | `npm run seed` creates 4 users in <5s |
| No tests | "I tested it by hand" | Evaluators run `npm test`, if it fails, you fail |
| Terrible README | Evaluator tries to run it, fails, assumes it doesn't work | Test the README: have someone else follow it |
| Ignoring 48h constraint | You stay up 72h coding, ship broken code out of sleep deprivation | Timebox each phase, cut scope if you slip |

---

## File Map

After you're done, repo should look like this:

```
bank-licensing-app/
├── README.md ⭐ Evaluator starts here
├── DESIGN-DOCUMENT.md ⭐ Evaluator reads this next
├── SPRINT_48H.md (this planning doc)
├── TECH_STACK.md (reference)
├── EVALUATION_CHECKLIST.md (sanity check)
├── openapi.yaml (API docs)
├── src/
│   ├── server.ts
│   ├── entities/ (User, Application, Document, AuditLog)
│   ├── services/ (Auth, StateMachine, AuditLogger, etc.)
│   ├── routes/ (auth, applications, documents, audit)
│   ├── middleware/ (authMiddleware, roleMiddleware)
│   ├── database/
│   │   └── migrations/ (001_init.sql, etc.)
│   └── __tests__/ (unit + integration tests)
├── frontend/
│   ├── src/
│   │   ├── pages/ (Login, Dashboard)
│   │   ├── components/ (ProtectedRoute, ApplicationDetail, etc.)
│   │   └── App.tsx
│   └── public/
├── scripts/
│   ├── seed.ts (create 4 users)
│   └── seedApplications.ts (create 2 apps)
├── data/
│   └── files/ (simulated file storage)
├── package.json
├── tsconfig.json
└── .gitignore (includes .env, node_modules/, data/)
```

---

## Quick Reference: The Three Non-Negotiables

### Rule #1: Separation of Duties ✅
```typescript
// Before approver can approve:
const app = await Application.findOne(appId);
if (app.current_reviewer_id === userId) {
  return res.status(403).json({ error: 'Cannot approve own review' });
}
```

**Test it:**
```bash
# Login as reviewer@example.com
POST /auth/login
→ get token (reviewer)

# Reviewer reads an app
GET /applications/1
→ updates app.current_reviewer_id = reviewer.id

# Same user tries to approve
PATCH /applications/1/decide { decision: "APPROVED" }
→ Should return 403 Forbidden
```

### Rule #2: Immutable Audit Log ✅
```sql
-- In migration:
CREATE RULE audit_log_immutable AS 
  ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS 
  ON DELETE TO audit_log DO INSTEAD NOTHING;
```

**Test it:**
```sql
-- This should fail silently (no error, no rows affected):
UPDATE audit_log SET action = 'HACKED' WHERE id = 1;
SELECT * FROM audit_log; -- Original unchanged
```

### Rule #3: Backend Enforcement ✅
```typescript
// WRONG: Frontend checks role
if (user.role === 'REVIEWER') {
  showApproveButton(); // User edits HTML, calls approve API
}

// RIGHT: Backend checks role
router.patch('/applications/:id/decide',
  authMiddleware,
  requireRole('APPROVER'), // ← Backend enforces
  async (req, res) => { ... }
);
```

**Test it:**
```bash
# Logout from browser, then:
curl -X PATCH http://localhost:3000/applications/1/decide \
  -H "Authorization: Bearer <reviewer-token>" \
  -H "Content-Type: application/json" \
  -d '{ "decision": "APPROVED" }'
→ Should return 403 Forbidden
```

---

## Timeline Reality Check

| Timeline | When | What You Should Have |
|---|---|---|
| Hour 0 | Now | Repo set up, reading this |
| Hour 6 | Tonight | Database + auth working |
| Hour 12 | Midnight | Can login + create apps |
| Hour 24 | Tomorrow morning | Full workflow works (applicant → approver) |
| Hour 36 | Tomorrow afternoon | Tests passing |
| Hour 42 | Before dinner | Frontend working |
| Hour 48 | End of tomorrow | Ship, rest, celebrate |

**Honest assessment**: If you're at hour 24 and basic workflows don't work, you're behind. Cut scope: drop fancy frontend, focus on backend working 100%.

---

## The Evaluator's Perspective

When evaluators run your code, they're checking:

1. **Can I get it running in 10 minutes?** (README + seed script)
2. **Does the happy path work?** (applicant → reviewer → approver → approved)
3. **Is it secure?** (role boundaries solid, audit immutable)
4. **Is it tested?** (`npm test` passes, tests are sensible)
5. **Would I be comfortable reading this code in code review?** (clean, organized, maintainable)
6. **Did you think about trade-offs?** (design doc shows reasoning)

**You want them thinking**: "Senior-level work. This person understands regulatory systems."

Not: "Kinda works, but brittle."

---

## Go Time

1. **Open SPRINT_48H.md** (your ticket list)
2. **Follow it in order** (don't jump around)
3. **Check off each ticket** as you complete it
4. **Use EVALUATION_CHECKLIST.md** as your final sanity check
5. **When done, copy-paste this README into git**: `git add .; git commit -m "Initial commit"`

Good luck. You've got this. 💪

---

## Questions?

- "How much time do I have for frontend?" → Not much. Make it functional, not pretty.
- "Should I use Docker?" → No. Keep it simple: npm + local postgres.
- "What if I can't finish everything?" → Cut scope. Perfect core > incomplete everything.
- "Do I need email notifications?" → No. Out of scope. Log to console instead.
- "What if tests fail at the end?" → Fix the code, not the test. Tests are right.

**Most important**: Ship something that works and is secure. An incomplete but correct system beats a "feature-complete" insecure one every time.

