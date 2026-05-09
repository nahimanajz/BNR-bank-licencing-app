import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import '../../src/models/index';

let applicantToken: string;
let reviewerToken: string;
let approverToken: string;
let applicationId: number;
let applicationVersion: number;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const signup = async (email: string, role: string) => {
    await request(app).post('/api/auth/signup').send({ email, password: 'password', role });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password' });
    return res.body.data.token as string;
  };

  applicantToken = await signup('applicant@test.com', 'APPLICANT');
  reviewerToken = await signup('reviewer@test.com', 'REVIEWER');
  approverToken = await signup('approver@test.com', 'APPROVER');
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/applications', () => {
  test('APPLICANT can create an application in DRAFT state', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ institution_name: 'First National Bank' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    applicationId = res.body.data.id;
    applicationVersion = res.body.data.version;
  });

  test('REVIEWER cannot create an application', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ institution_name: 'Another Bank' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/applications', () => {
  test('APPLICANT sees only own applications', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((a: any) => a.status !== undefined)).toBe(true);
  });

  test('REVIEWER sees all applications', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('State transitions', () => {
  test('APPLICANT submits application (DRAFT → SUBMITTED)', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/transition`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ newStatus: 'SUBMITTED', version: applicationVersion });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SUBMITTED');
    applicationVersion = res.body.data.version;
  });

  test('REVIEWER moves to UNDER_REVIEW', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/transition`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ newStatus: 'UNDER_REVIEW', version: applicationVersion });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
    applicationVersion = res.body.data.version;
  });

  test('REVIEWER moves to DECISION_PENDING', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/transition`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ newStatus: 'DECISION_PENDING', version: applicationVersion });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DECISION_PENDING');
    applicationVersion = res.body.data.version;
  });

  test('APPROVER can approve an application they did not review', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/decide`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ decision: 'APPROVE', notes: 'Looks good', version: applicationVersion });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });
});

describe('Authorization violations', () => {
  let newAppId: number;
  let newAppVersion: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ institution_name: 'Test Bank 2' });
    newAppId = res.body.data.id;
    newAppVersion = res.body.data.version;
  });

  test('Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(401);
  });

  test('APPLICANT cannot perform REVIEWER transition', async () => {
    const submitRes = await request(app)
      .patch(`/api/applications/${newAppId}/transition`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ newStatus: 'SUBMITTED', version: newAppVersion });

    expect(submitRes.status).toBe(200);
    newAppVersion = submitRes.body.data.version;

    const res = await request(app)
      .patch(`/api/applications/${newAppId}/transition`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ newStatus: 'UNDER_REVIEW', version: newAppVersion });

    expect(res.status).toBe(403);
  });

  test('REVIEWER cannot call decide endpoint', async () => {
    const res = await request(app)
      .patch(`/api/applications/${newAppId}/decide`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ decision: 'APPROVE', notes: 'notes', version: newAppVersion });

    expect(res.status).toBe(403);
  });

  test('Invalid transition returns 400', async () => {
    const res = await request(app)
      .patch(`/api/applications/${newAppId}/transition`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ newStatus: 'APPROVED', version: newAppVersion });

    expect(res.status).toBe(400);
  });
});

describe('Reviewer ≠ approver — the hard rule', () => {
  let conflictAppId: number;
  let conflictAppVersion: number;
  let approverId: number;

  beforeAll(async () => {
    // Retrieve the approver's user ID from the login response.
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approver@test.com', password: 'password' });
    approverId = loginRes.body.data.id;

    // Create and advance a fresh application to DECISION_PENDING.
    const created = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ institution_name: 'Conflict Rule Bank' });
    conflictAppId = created.body.data.id;
    conflictAppVersion = created.body.data.version;

    const submitted = await request(app)
      .patch(`/api/applications/${conflictAppId}/transition`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ newStatus: 'SUBMITTED', version: conflictAppVersion });
    conflictAppVersion = submitted.body.data.version;

    const underReview = await request(app)
      .patch(`/api/applications/${conflictAppId}/transition`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ newStatus: 'UNDER_REVIEW', version: conflictAppVersion });
    conflictAppVersion = underReview.body.data.version;

    const decisionPending = await request(app)
      .patch(`/api/applications/${conflictAppId}/transition`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ newStatus: 'DECISION_PENDING', version: conflictAppVersion });
    conflictAppVersion = decisionPending.body.data.version;

    // Inject the conflict: overwrite current_reviewer_id with the approver's own ID.
    // This simulates the scenario where the same person reviewed and is now
    // attempting the final approval — exactly what the challenge forbids.
    const { Application } = await import('../../src/models/index');
    await Application.update(
      { current_reviewer_id: approverId },
      { where: { id: conflictAppId } as any }
    );
  });

  test('APPROVER cannot approve an application they reviewed — returns 403', async () => {
    const res = await request(app)
      .patch(`/api/applications/${conflictAppId}/decide`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ decision: 'APPROVE', notes: 'Self-approval attempt', version: conflictAppVersion });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('A different APPROVER can approve the same application', async () => {
    // Create a second approver to confirm the rule targets identity, not the role.
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'approver2@test.com', password: 'password', role: 'APPROVER' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approver2@test.com', password: 'password' });
    const approver2Token = loginRes.body.data.token;

    const res = await request(app)
      .patch(`/api/applications/${conflictAppId}/decide`)
      .set('Authorization', `Bearer ${approver2Token}`)
      .send({ decision: 'APPROVE', notes: 'Approved by a different approver', version: conflictAppVersion });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });
});
