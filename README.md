# BNR Bank Licensing Portal

A regulatory portal for Rwanda's National Bank to manage commercial bank licensing applications.

---

## Quick Start

```bash
npm install
createdb bank_licensing
npm run migrate
npm run seed
npm start
```

Frontend (separate terminal):
```bash
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:3001

---

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| APPLICANT | applicant@bnr.rw | password123 |
| REVIEWER | reviewer@bnr.rw | password123 |
| APPROVER | approver@bnr.rw | password123 |
| ADMIN | admin@bnr.rw | password123 |

---

## API Docs

Available at http://localhost:3000/api-docs after starting the server.
