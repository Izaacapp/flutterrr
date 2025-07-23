"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockBoardingPass = exports.createMockPost = exports.createMockUser = void 0;
// Test mock factories
const createMockUser = (overrides = {}) => ({
    _id: '123456789',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'hashedpassword',
    emailVerified: true,
    ...overrides
});
exports.createMockUser = createMockUser;
const createMockPost = (overrides = {}) => ({
    _id: 'post123',
    content: 'Test post content',
    author: (0, exports.createMockUser)(),
    likes: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});
exports.createMockPost = createMockPost;
const createMockBoardingPass = (overrides = {}) => ({
    text: 'JOHN DOE\nFLIGHT AA123\nJFK > LAX\nDEPARTURE 10:30AM',
    airline: 'AA',
    flightNumber: 'AA123',
    origin: 'JFK',
    destination: 'LAX',
    departureTime: '10:30',
    ...overrides
});
exports.createMockBoardingPass = createMockBoardingPass;
