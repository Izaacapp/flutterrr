"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../src/app"));
const User_1 = __importDefault(require("../../src/models/User"));
describe('Authentication Integration Tests', () => {
    beforeAll(async () => {
        // Connect to test database
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:pass@localhost:27017/test_db?authSource=admin';
        await mongoose_1.default.connect(MONGO_URI);
    });
    afterAll(async () => {
        // Clean up
        await User_1.default.deleteMany({});
        await mongoose_1.default.connection.close();
    });
    beforeEach(async () => {
        // Clear users before each test
        await User_1.default.deleteMany({});
    });
    describe('POST /api/auth/signup', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                fullName: 'Test User',
                username: 'testuser123',
                email: 'test@example.com',
                password: 'Test123!',
                passwordConfirm: 'Test123!'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/signup')
                .send(userData)
                .expect(201);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toContain('verification');
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.token).toBeDefined();
            // Verify user was created in database
            const user = await User_1.default.findOne({ email: userData.email });
            expect(user).toBeDefined();
            expect(user?.emailVerified).toBe(false);
        });
        it('should reject duplicate email', async () => {
            const userData = {
                fullName: 'Test User',
                username: 'testuser1',
                email: 'duplicate@example.com',
                password: 'Test123!',
                passwordConfirm: 'Test123!'
            };
            // Create first user
            await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/signup')
                .send(userData)
                .expect(201);
            // Try to create duplicate
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/signup')
                .send({
                ...userData,
                username: 'different'
            })
                .expect(400);
            expect(response.body.error).toContain('Email already registered');
        });
        it('should reject weak password', async () => {
            const userData = {
                fullName: 'Test User',
                username: 'testuser2',
                email: 'weak@example.com',
                password: '123',
                passwordConfirm: '123'
            };
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/signup')
                .send(userData)
                .expect(400);
            expect(response.body.error).toBeDefined();
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a verified user for login tests
            await User_1.default.create({
                fullName: 'Login Test User',
                username: 'loginuser',
                email: 'login@example.com',
                password: 'Test123!',
                emailVerified: true
            });
        });
        it('should login with valid email', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                emailOrUsername: 'login@example.com',
                password: 'Test123!'
            })
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe('login@example.com');
        });
        it('should login with valid username', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                emailOrUsername: 'loginuser',
                password: 'Test123!'
            })
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.token).toBeDefined();
        });
        it('should reject invalid password', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                emailOrUsername: 'login@example.com',
                password: 'WrongPassword'
            })
                .expect(401);
            expect(response.body.error).toContain('Invalid credentials');
        });
        it('should reject non-existent user', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                emailOrUsername: 'nonexistent@example.com',
                password: 'Test123!'
            })
                .expect(401);
            expect(response.body.error).toContain('Invalid credentials');
        });
    });
    describe('GET /api/auth/me', () => {
        it('should return user data with valid token', async () => {
            // First login to get token
            const loginResponse = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/signup')
                .send({
                fullName: 'Token Test',
                username: 'tokenuser',
                email: 'token@example.com',
                password: 'Test123!',
                passwordConfirm: 'Test123!'
            });
            const token = loginResponse.body.token;
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(response.body.status).toBe('success');
            expect(response.body.user.email).toBe('token@example.com');
        });
        it('should reject request without token', async () => {
            await (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .expect(401);
        });
    });
});
