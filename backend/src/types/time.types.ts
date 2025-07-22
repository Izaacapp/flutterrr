import { safeStrictDateExtraction } from "../utils/dateStrict";
/**
 * MANDATORY TIMEZONE DECLARATIONS
 * 
 * ALL time handling in this codebase MUST use these types.
 * Raw Date objects without timezone context are BANNED.
 */

export interface ZonedDateTime {
  timestamp: Date;
  timezone: string;        // IANA format (e.g., "America/New_York")
  airportCode?: string;    // Optional but recommended
  confidence?: number;     // OCR confidence if applicable
}

export interface FlightTimeSet {
  departure: ZonedDateTime;
  arrival: ZonedDateTime;
  boarding?: ZonedDateTime;
  gate?: ZonedDateTime;
  checkin?: ZonedDateTime;
}

export interface TimeExtractionResult {
  times: Partial<FlightTimeSet>;
  errors: string[];
  warnings: string[];
  method: 'ocr' | 'manual' | 'barcode' | 'human';
}

export interface TimeValidation {
  field: keyof FlightTimeSet;
  valid: boolean;
  error?: string;
  suggestion?: string;
}

// BANNED: Using these will trigger audit failures
export type BANNED_Date = never; // Don't use raw Date
export type BANNED_getTime = never; // Don't use getTime() math
export type BANNED_setHours = never; // Don't use setHours without timezone

/**
 * MANDATORY: Use these helper functions instead
 */
export function createZonedDateTime(
  timestamp: Date | string,
  airportCode: string
): ZonedDateTime {
  // This is implemented in timeHandling.service.ts
  throw new Error('Import from timeHandling.service.ts');
}

export function compareZonedDateTimes(
  a: ZonedDateTime,
  b: ZonedDateTime
): number {
  // Compares across timezones correctly
  throw new Error('Import from timeHandling.service.ts');
}

export function formatZonedDateTime(
  zdt: ZonedDateTime,
  format: string
): string {
  // Formats with timezone awareness
  throw new Error('Import from timeHandling.service.ts');
}