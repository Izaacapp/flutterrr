// import { strictDateExtraction } from "../utils/dateStrict";
// import { safeStrictDateExtraction } from "../utils/dateStrict";
import { correctOcrTime } from '../src/services/timeHandling.service';
import { validateTime } from '../src/utils/boardingPassValidator';

describe('OCR Time Corrections', () => {
  describe('correctOcrTime', () => {
    it('should only correct times with low confidence', () => {
      // Low confidence - should correct
      expect(correctOcrTime('13:80', 0.5).time).toBe('13:30');
      expect(correctOcrTime('25:30', 0.4).time).toBe('01:30');
      expect(correctOcrTime('14:70', 0.6).time).toBe('14:10');
      
      // High confidence - should NOT correct
      expect(correctOcrTime('13:30', 0.9).time).toBe('13:30');
      expect(correctOcrTime('14:45', 0.95).time).toBe('14:45');
    });

    it('should reduce confidence after correction', () => {
      const result = correctOcrTime('13:80', 0.6);
      expect(result.confidence).toBeLessThan(0.6);
    });

    it('should handle edge cases', () => {
      expect(correctOcrTime('99:99', 0.3).time).toBe('03:39');
      expect(correctOcrTime('00:00', 0.9).time).toBe('00:00');
    });
  });

  describe('validateTime', () => {
    it('should validate correct times', () => {
      expect(validateTime('14:30').valid).toBe(true);
      expect(validateTime('23:59').valid).toBe(true);
      expect(validateTime('00:00').valid).toBe(true);
    });

    it('should correct invalid times', () => {
      const result1 = validateTime('25:70');
      expect(result1.valid).toBe(true);
      expect(result1.value).toBe('01:10');
      
      const result2 = validateTime('13:80');
      expect(result2.valid).toBe(true);
      expect(result2.value).toBe('13:30');
    });

    it('should handle AM/PM format', () => {
      expect(validateTime('4:45PM').value).toBe('16:45');
      expect(validateTime('12:00AM').value).toBe('00:00');
      expect(validateTime('12:00PM').value).toBe('12:00');
    });
  });

  describe('No hardcoded corrections allowed', () => {
    it('should not have hardcoded 80->30 or 70->10 without confidence check', () => {
      // This test ensures the correction logic is confidence-based
      const highConfidenceResult = correctOcrTime('13:80', 0.8);
      const lowConfidenceResult = correctOcrTime('13:80', 0.5);
      
      // With high confidence (0.8), corrections should be minimal or none
      // With low confidence (0.5), corrections should happen
      expect(highConfidenceResult.time).not.toBe(lowConfidenceResult.time);
    });
  });
});