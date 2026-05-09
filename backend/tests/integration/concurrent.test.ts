import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import '../../src/models/index';

/**
 * Concurrent access test.
 *
 * The application uses optimistic locking: every write includes the caller's
 * expected `version` in a WHERE clause. If another request has already
 * incremented the version, `rowsUpdated` is 0 and we respond 409.
 *
 * This test proves that two simultaneous transitions against the same version
 * number produce exactly one success and one conflict.
 */

let applicantToken: string;
let reviewerToken: string;

// raceAppId — advanced to UNDER_REVIEW, used for the concurrent race test.
let raceAppId: number;
let versionAtUnderReview: number;

// staleAppId — also at UNDER_REVIEW, kept pristine so we can send a valid
// transition with a deliberately stale version and isolate the 409.
let staleAppId: number;

const advanceToUnderReview = async (institutionName: string) => {
  const created = await request(app)
    .post('/api/applications')
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ institution_name: institutionName });

  const submitted = await request(app)
    .patch(`/api/applications/${created.body.data.id}/transition`)
    .set('Authorization', `Bearer ${applicantToken}`)
    .send({ newStatus: 'SUBMITTED', version: created.body.data.version });

  const underReview = await request(app)
    .patch(`/api/applications/${created.body.data.id}/transition`)
    .set('Authorization', `Bearer ${reviewerToken}`)
    .send({ newStatus: 'UNDER_REVIEW', version: submitted.body.data.version });

  return { id: created.body.data.id, version: underReview.body.data.version };
};

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const signup = async (email: string, role: string): Promise<string> => {
    await request(app).post('/api/auth/signup').send({ email, password: 'password123', role });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    return res.body.data.token as string;
  };

  applicantToken = await signup('concurrent-applicant@test.com', 'APPLICANT');
  reviewerToken = await signup('concurrent-reviewer@test.com', 'REVIEWER');

  const raceApp = await advanceToUnderReview('Concurrent Race Bank');
  raceAppId = raceApp.id;
  versionAtUnderReview = raceApp.version;

  const staleApp = await advanceToUnderReview('Stale Version Bank');
  staleAppId = staleApp.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Optimistic locking — concurrent transitions', () => {
  test('two simultaneous requests with the same version: one succeeds (200), one conflicts (409)', async () => {
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/applications/${raceAppId}/transition`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ newStatus: 'DECISION_PENDING', version: versionAtUnderReview }),
      request(app)
        .patch(`/api/applications/${raceAppId}/transition`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ newStatus: 'DECISION_PENDING', version: versionAtUnderReview }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  test('a stale version is rejected even without a race', async () => {
    // staleApp is in UNDER_REVIEW — UNDER_REVIEW → DECISION_PENDING is a valid
    // transition, so the state machine passes. Version 1 is stale (current is
    // staleAppVersion), so updateWithVersion finds 0 rows and returns 409.
    const res = await request(app)
      .patch(`/api/applications/${staleAppId}/transition`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ newStatus: 'DECISION_PENDING', version: 1 });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
