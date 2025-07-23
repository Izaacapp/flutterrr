"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generateOtp_1 = __importDefault(require("../../../src/utils/generateOtp"));
describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
        const otp = (0, generateOtp_1.default)();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
    });
    it('should generate OTPs within valid range', () => {
        for (let i = 0; i < 100; i++) {
            const otp = (0, generateOtp_1.default)();
            const otpNumber = parseInt(otp, 10);
            expect(otpNumber).toBeGreaterThanOrEqual(100000);
            expect(otpNumber).toBeLessThanOrEqual(999999);
        }
    });
    it('should generate different OTPs', () => {
        const otps = new Set();
        for (let i = 0; i < 50; i++) {
            otps.add((0, generateOtp_1.default)());
        }
        // Should have generated at least some different OTPs
        expect(otps.size).toBeGreaterThan(1);
    });
});
