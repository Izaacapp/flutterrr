"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const User_1 = __importDefault(require("../../src/models/User"));
const mockFactories_1 = require("../utils/mockFactories");
describe('Critical Path Tests', () => {
    describe('Authentication Flow', () => {
        it('should register a new user', async () => {
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/signup')
                .send({
                fullName: 'Test User',
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!',
                passwordConfirm: 'Test123!'
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toContain('verification');
        });
        it('should login with valid credentials', async () => {
            const user = await User_1.default.create((0, mockFactories_1.createMockUser)({
                password: 'Test123!',
                emailVerified: true
            }));
            const response = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({
                emailOrUsername: user.email,
                password: 'Test123!'
            });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });
    });
    describe('Post Creation', () => {
        it('should create a post with authentication', async () => {
            // Add post creation test
        });
    });
    describe('Flight Upload', () => {
        it('should process boarding pass image', async () => {
            // Add boarding pass test
        });
    });
});
