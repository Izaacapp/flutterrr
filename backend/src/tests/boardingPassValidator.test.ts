import { safeStrictDateExtraction } from "../utils/dateStrict";
import { 
  validateBoardingPass, 
  validateFlightNumber, 
  validateTime, 
  validateAirport,
  filterLowConfidence
} from '../utils/boardingPassValidator';

describe('Boarding Pass Validator', () => {
  describe('Flight Number Validation', () => {
    it('should validate correct flight numbers', () => {
      const result = validateFlightNumber('DL1234');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('DL1234');
    });

    it('should suggest corrections for typos', () => {
      const result = validateFlightNumber('DZ1234');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe('DL1234');
    });

    it('should handle flight numbers with spaces', () => {
      const result = validateFlightNumber('UA 456');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('UA456');
    });
  });

  describe('Time Validation', () => {
    it('should validate correct times', () => {
      const result = validateTime('15:30');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('15:30');
    });

    it('should fix invalid times', () => {
      const result = validateTime('25:70');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('01:10');
    });

    it('should handle AM/PM format', () => {
      const result = validateTime('4:45PM');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('16:45');
    });

    it('should fix common OCR errors', () => {
      const result = validateTime('13:80');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('13:30');
    });
  });

  describe('Airport Validation', () => {
    it('should validate common airports', () => {
      const result = validateAirport('LAX');
      expect(result.valid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should suggest corrections for OCR errors', () => {
      const result = validateAirport('IAX');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe('LAX');
    });

    it('should accept uncommon but valid airports', () => {
      const result = validateAirport('XYZ');
      expect(result.valid).toBe(true);
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Confidence Filtering', () => {
    it('should filter low confidence words', () => {
      const ocrResult = {
        text: 'DL1234 DEP 15:30 LAX→JFK',
        confidence: [
          { word: 'DL1234', confidence: 0.95 },
          { word: 'DEP', confidence: 0.80 },
          { word: '15:30', confidence: 0.60 },
          { word: 'LAX→JFK', confidence: 0.40 }
        ]
      };
      
      const filtered = filterLowConfidence(ocrResult, 0.75);
      expect(filtered).toBe('DL1234 DEP');
    });
  });

  describe('Full Boarding Pass Validation', () => {
    it('should validate a complete boarding pass', () => {
      const text = 'DELTA DL1234 DEPART 15:30 LAX TO JFK OCTOBER 9, 2024 SEAT 12A GATE B12';
      const result = validateBoardingPass(text);
      
      expect(result.validations.flightNumber.valid).toBe(true);
      expect(result.validations.departureTime.valid).toBe(true);
      expect(result.validations.airports.origin.valid).toBe(true);
      expect(result.validations.airports.destination.valid).toBe(true);
      expect(result.validations.date.valid).toBe(true);
      expect(result.validations.seat.valid).toBe(true);
      expect(result.validations.gate.valid).toBe(true);
      
      expect(result.extractedData).toMatchObject({
        flightNumber: 'DL1234',
        departureTime: '15:30',
        origin: 'LAX',
        destination: 'JFK',
        seat: '12A',
        gate: 'B12'
      });
    });

    it('should handle partial boarding pass data', () => {
      const text = 'UNITED UA456 LAX - JFK 10:45AM';
      const result = validateBoardingPass(text);
      
      expect(result.validations.flightNumber.valid).toBe(true);
      expect(result.validations.airports.origin.valid).toBe(true);
      expect(result.validations.airports.destination.valid).toBe(true);
      expect(result.validations.departureTime.valid).toBe(true);
      
      expect(result.extractedData).toMatchObject({
        flightNumber: 'UA456',
        origin: 'LAX',
        destination: 'JFK',
        departureTime: '10:45'
      });
    });

    it('should handle OCR errors with corrections', () => {
      const text = 'DEITA DZ1234 DEPART 25:30 IAX TO JFK';
      const result = validateBoardingPass(text);
      
      expect(result.validations.flightNumber.suggestion).toBe('DL1234');
      expect(result.validations.departureTime.value).toBe('01:30');
      expect(result.validations.airports.origin.suggestion).toBe('LAX');
      
      expect(result.extractedData.flightNumber).toBe('DL1234');
      expect(result.extractedData.origin).toBe('LAX');
    });

    it('should handle Ryanair boarding pass', () => {
      const text = 'RYANAIR FR1234 DUB TO BCN 06:30 BOARDING 06:00 SEAT 15F';
      const result = validateBoardingPass(text);
      
      expect(result.validations.flightNumber.valid).toBe(true);
      expect(result.extractedData.flightNumber).toBe('FR1234');
      expect(result.extractedData.boardingTime).toBe('06:00');
    });

    it('should handle boarding pass with dashes in time', () => {
      const text = 'FLIGHT AA789 - DEPARTURE TIME 4:45AM LAX-JFK SEAT 25C';
      const result = validateBoardingPass(text);
      
      expect(result.validations.departureTime.valid).toBe(true);
      expect(result.extractedData.departureTime).toBe('04:45');
    });
  });
});