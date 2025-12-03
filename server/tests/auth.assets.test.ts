import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

const TEST_EMAIL = 'test-admin@example.com';
const TEST_PASSWORD = 'secret123!';

beforeAll(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Auth + Assets flow', () => {
  it('should bootstrap admin then login and fetch assets', async () => {
    // bootstrap
    const bootstrap = await request(app)
      .post('/api/auth/bootstrap')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, role: 'ADMIN', canEdit: true });
    expect([200, 201]).toContain(bootstrap.status);

    // login
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    const token = login.body.token;
    expect(token).toBeTruthy();

    // assets list (should 200 and array)
    const assets = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${token}`);
    expect(assets.status).toBe(200);
    expect(Array.isArray(assets.body)).toBe(true);
  });
});
