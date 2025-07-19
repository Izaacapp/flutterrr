import generateOtp from '../../../src/utils/generateOtp';

describe('generateOtp', () => {
  it('should generate a 6-digit OTP', () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should generate OTPs within valid range', () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOtp();
      const otpNumber = parseInt(otp, 10);
      expect(otpNumber).toBeGreaterThanOrEqual(100000);
      expect(otpNumber).toBeLessThanOrEqual(999999);
    }
  });

  it('should generate different OTPs', () => {
    const otps = new Set();
    for (let i = 0; i < 50; i++) {
      otps.add(generateOtp());
    }
    // Should have generated at least some different OTPs
    expect(otps.size).toBeGreaterThan(1);
  });
});