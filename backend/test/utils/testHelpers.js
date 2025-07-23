"use strict";
// Test helpers with retry logic and robust patterns
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RETRY_OPTIONS = void 0;
exports.withRetry = withRetry;
exports.waitForCondition = waitForCondition;
exports.waitForDatabase = waitForDatabase;
exports.testEmailDelivery = testEmailDelivery;
exports.checkServiceHealth = checkServiceHealth;
exports.testNetworkConnectivity = testNetworkConnectivity;
exports.generateTestUser = generateTestUser;
exports.generateTestOTP = generateTestOTP;
exports.cleanupTestData = cleanupTestData;
exports.DEFAULT_RETRY_OPTIONS = {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2,
};
// Retry helper for flaky operations
async function withRetry(fn, options = exports.DEFAULT_RETRY_OPTIONS) {
    const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw error;
            }
            const waitTime = delay * Math.pow(backoff, attempt - 1);
            console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    throw lastError || new Error('All retry attempts failed');
}
// Wait for condition with timeout
async function waitForCondition(condition, timeoutMs = 10000, intervalMs = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        if (await condition()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Condition not met within ${timeoutMs}ms`);
}
// Test database connection helper
async function waitForDatabase(mongoUri, maxWaitTime = 30000) {
    const mongoose = require('mongoose');
    await withRetry(async () => {
        await mongoose.connect(mongoUri);
        await mongoose.connection.close();
    }, {
        maxAttempts: 10,
        delay: 3000,
        backoff: 1,
    });
}
// Email delivery test helper
async function testEmailDelivery(apiUrl, testEmail) {
    try {
        const response = await fetch(`${apiUrl}/api/test-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: testEmail }),
        });
        const result = await response.json();
        return result.success === true;
    }
    catch (error) {
        console.error('Email test failed:', error);
        return false;
    }
}
// Service health check helper
async function checkServiceHealth(serviceUrl) {
    try {
        const response = await fetch(`${serviceUrl}/api/health`);
        const health = await response.json();
        return health.status === 'UP';
    }
    catch {
        return false;
    }
}
// Network connectivity test
async function testNetworkConnectivity(endpoints) {
    const results = await Promise.all(endpoints.map(async (endpoint) => {
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return {
                endpoint,
                success: response.ok,
                error: response.ok ? undefined : `HTTP ${response.status}`,
            };
        }
        catch (error) {
            return {
                endpoint,
                success: false,
                error: error.message,
            };
        }
    }));
    return results;
}
// Mock data generators
function generateTestUser(overrides = {}) {
    const id = Math.random().toString(36).substring(7);
    return {
        username: `testuser_${id}`,
        email: `test_${id}@example.com`,
        password: 'Test123!',
        ...overrides,
    };
}
function generateTestOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// Test cleanup helper
async function cleanupTestData(modelName, filter) {
    try {
        const mongoose = require('mongoose');
        const Model = mongoose.model(modelName);
        await Model.deleteMany(filter);
    }
    catch (error) {
        console.warn(`Failed to cleanup ${modelName}:`, error);
    }
}
