import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../../src/config/database';
import '../../src/models/index';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/auth/signup', () => {
  test('creates a user and returns user data', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'test@example.com',
      password: 'secret123',
      role: 'APPLICANT',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email', 'test@example.com');
    expect(res.body.data).toHaveProperty('role', 'APPLICANT');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  test('rejects duplicate email with 409', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'test@example.com',
      password: 'secret123',
      role: 'APPLICANT',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('rejects invalid role with 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'bad@example.com',
      password: 'secret123',
      role: 'SUPERADMIN',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/signup').send({
      email: 'login@example.com',
      password: 'password123',
      role: 'APPLICANT',
    });
  });

  test('returns JWT token on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 on unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 on expired/invalid token for protected route', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });
});
