"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const prisma_1 = __importDefault(require("../src/lib/prisma"));
const TEST_EMAIL = 'test-admin@example.com';
const TEST_PASSWORD = 'secret123!';
beforeAll(async () => {
    await prisma_1.default.user.deleteMany();
});
afterAll(async () => {
    await prisma_1.default.user.deleteMany();
    await prisma_1.default.$disconnect();
});
describe('Auth + Assets flow', () => {
    it('should bootstrap admin then login and fetch assets', async () => {
        // bootstrap
        const bootstrap = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/bootstrap')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD, role: 'ADMIN', canEdit: true });
        expect([200, 201]).toContain(bootstrap.status);
        // login
        const login = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
        expect(login.status).toBe(200);
        const token = login.body.token;
        expect(token).toBeTruthy();
        // assets list (should 200 and array)
        const assets = await (0, supertest_1.default)(app_1.default)
            .get('/api/assets')
            .set('Authorization', `Bearer ${token}`);
        expect(assets.status).toBe(200);
        expect(Array.isArray(assets.body)).toBe(true);
    });
});
//# sourceMappingURL=auth.assets.test.js.map