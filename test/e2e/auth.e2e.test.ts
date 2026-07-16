import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { buildTestApp } from '../integration/helpers/build-test-app';
import { signAdminToken, bearer } from '../integration/helpers/jwt';
import { rawQuery } from './helpers/db';

// Real DB, real bcrypt, real JWT — only the SMTP send is mocked, since actually
// delivering email isn't part of what this suite verifies and would make it
// depend on network/SMTP availability.
jest.mock('../../src/infrastructure/services/email');

import { buildAuthModule } from '../../src/modules/auth/infrastructure/config/auth.module';

const app = buildTestApp([{ path: '/api/users', router: buildAuthModule().router }]);

const suffix = Date.now().toString().slice(-8);
const testUsername = `e2e${suffix}`;
const testEmail = `e2e_test_${suffix}@example.com`;
const testPassword = 'SecurePass123';

describe('Auth E2E (real database)', () => {
  afterAll(async () => {
    await rawQuery('MYDATABASEAUTH', 'DELETE FROM users WHERE email = ?', [testEmail]);
    await rawQuery('MYDATABASEAUTH', 'DELETE FROM email_verification WHERE email = ?', [testEmail]);
  });

  it('registration step 1: stores a real verification code and does not create the user yet', async () => {
    const res = await request(app).post('/api/users/add').send({
      first_name: 'E2E',
      last_name: 'Test',
      username: testUsername,
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Verification code sent');

    const users = await rawQuery<any[]>('MYDATABASEAUTH', 'SELECT id FROM users WHERE email = ?', [testEmail]);
    expect(users).toHaveLength(0);

    const codes = await rawQuery<any[]>(
      'MYDATABASEAUTH',
      'SELECT verification_code FROM email_verification WHERE email = ? ORDER BY id DESC LIMIT 1',
      [testEmail]
    );
    expect(codes).toHaveLength(1);
  });

  it('registration step 2: creates the user for real once the stored code is confirmed', async () => {
    const codes = await rawQuery<any[]>(
      'MYDATABASEAUTH',
      'SELECT verification_code FROM email_verification WHERE email = ? ORDER BY id DESC LIMIT 1',
      [testEmail]
    );
    const verificationCode = codes[0].verification_code;

    const res = await request(app).post('/api/users/add').send({
      first_name: 'E2E',
      last_name: 'Test',
      username: testUsername,
      email: testEmail,
      password: testPassword,
      verificationCode,
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created successfully');
    expect(res.body.data.username).toBe(testUsername);
    expect(res.body.data.password).toBeUndefined();

    const users = await rawQuery<any[]>('MYDATABASEAUTH', 'SELECT id, role FROM users WHERE email = ?', [
      testEmail,
    ]);
    expect(users).toHaveLength(1);
    // Confirms the numeric UserRole.USER (2) round-trips correctly through the
    // ENUM('admin','user') column (MariaDB stores/reads enums by 1-based index).
    expect(users[0].role).toBe('user');
  });

  it('rejects a second registration attempt for the same email', async () => {
    const res = await request(app).post('/api/users/add').send({
      first_name: 'E2E',
      last_name: 'Test',
      username: `${testUsername}b`,
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Email already exists');
  });

  it('logs in with the newly created real user and gets a usable JWT', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: testUsername, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.data.user.username).toBe(testUsername);
  });

  it('rejects login with a wrong password against the real stored bcrypt hash', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: testUsername, password: 'WrongPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('admin resets the real user\'s password, and only the new password works afterward', async () => {
    const newPassword = 'NewSecurePass456';

    const resetRes = await request(app)
      .put('/api/users/admin/reset-password')
      .set('Authorization', bearer(signAdminToken()))
      .send({ identifier: testUsername, newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toBe('Password reset successfully');

    const oldPasswordRes = await request(app)
      .post('/api/users/login')
      .send({ username: testUsername, password: testPassword });
    expect(oldPasswordRes.status).toBe(400);

    const newPasswordRes = await request(app)
      .post('/api/users/login')
      .send({ username: testUsername, password: newPassword });
    expect(newPasswordRes.status).toBe(200);
    expect(newPasswordRes.body.data.user.username).toBe(testUsername);
  });

  it('rejects the admin reset-password endpoint without an admin token', async () => {
    const res = await request(app)
      .put('/api/users/admin/reset-password')
      .send({ identifier: testUsername, newPassword: 'irrelevant123' });

    expect(res.status).toBe(401);
  });
});
