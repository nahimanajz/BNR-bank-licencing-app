## Authentication & authorisation
- Implement a real authentication system. JWT or session-based ,justify your choice.
- The system must support multiple user roles with distinct permission boundaries. You decide what
the roles are and what each can do , but you must justify every boundary you draw.
-  Role enforcement must live in the backend. A user who bypasses the frontend must still be denied.
-  One hard rule that cannot be negotiated: the person who reviews an application cannot be the
same person who makes the final approval decision on it. Enforce this.

## Workflow & state integrity
- An application must move through a defined set of states from submission to final decision. You
design the state machine , document it clearly.
- Illegal state transitions must be rejected at the API level, not just the UI.
- A final decision ,approved or rejected ,is permanent. Design for this.
- Your system must handle two users attempting to act on the same application simultaneously
without producing an inconsistent state. Show how.

## Audit trail
- Every action taken on every application by any user , must be recorded permanently.
- The audit log must be append-only. No record may be modified or deleted after creation, including
by an administrator. Explain in your design document how you enforce this.
- Each audit entry must capture at minimum: the acting user, the action taken, the timestamp, and
the state of the application before and after.
- Assume this log may one day be presented as legal evidence. Design accordingly.

## Document handling
- Applicants must be able to upload supporting documents as part of their application.
- Simulate file storage no cloud integration required. Store file metadata (name, size, type,
uploader, timestamp) in your database.
- Maximum file size: 5MB per document. Enforce this server-side.
- Documents must be versioned if an applicant resubmits after a request for additional information,
the previous documents must remain accessible.

## API
- Your API must be consistent, well-structured, and handle errors gracefully. No raw stack traces in
responses.
- Unauthorised requests must return 403. Not 404. Not 500.
- Your API must be documented. A Postman collection, OpenAPI spec, or clear README equivalent
is required.
- Include seed scripts that create at least one user per role and two applications in different states.
Reviewers must be able to run your system without manual database setup.

## Frontend
- Build a functional web interface. This is an internal tool used by regulators and applicants
prioritise clarity and correctness over visual design.
- The UI must reflect the user’s role actions a user cannot perform must not be visible to them.
- Handle loading states, error states, and empty states. A broken UI that silently fails is worse than
no UI.