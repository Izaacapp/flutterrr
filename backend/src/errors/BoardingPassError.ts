import { strictDateExtraction } from "../utils/dateStrict";
export type BoardingPassErrorCode = 
  | 'DATE_PARSE_FAILED'
  | 'TIME_PARSE_FAILED'
  | 'AIRPORT_NOT_FOUND'
  | 'INVALID_DATE_RANGE'
  | 'TIMEZONE_MISMATCH'
  | 'MISSING_REQUIRED_FIELD'
  | 'OCR_CONFIDENCE_TOO_LOW'
  | 'ROUTE_NOT_FOUND'
  | 'INVALID_TIME_FORMAT';

export interface BoardingPassErrorContext {
  text?: string;
  field?: string;
  value?: any;
  confidence?: number;
  suggestion?: string;
  requiredFormat?: string;
}

export class BoardingPassError extends Error {
  public readonly code: BoardingPassErrorCode;
  public readonly context: BoardingPassErrorContext;
  public readonly timestamp: Date;

  constructor(code: BoardingPassErrorCode, context: BoardingPassErrorContext = {}) {
    const message = BoardingPassError.getErrorMessage(code, context);
    super(message);
    
    this.name = 'BoardingPassError';
    this.code = code;
    this.context = context;
    this.timestamp = strictDateExtraction();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BoardingPassError);
    }
  }

  private static getErrorMessage(code: BoardingPassErrorCode, context: BoardingPassErrorContext): string {
    const messages: Record<BoardingPassErrorCode, string> = {
      DATE_PARSE_FAILED: `Failed to extract date from boarding pass${context.text ? `: "${context.text.substring(0, 50)}..."` : ''}`,
      TIME_PARSE_FAILED: `Failed to parse time${context.field ? ` for ${context.field}` : ''}`,
      AIRPORT_NOT_FOUND: `Unknown airport code: ${context.value || 'N/A'}`,
      INVALID_DATE_RANGE: `Date ${context.value || 'N/A'} is outside valid range (±1-2 years)`,
      TIMEZONE_MISMATCH: `Timezone mismatch for ${context.field || 'field'}`,
      MISSING_REQUIRED_FIELD: `Required field missing: ${context.field || 'unknown'}`,
      OCR_CONFIDENCE_TOO_LOW: `OCR confidence (${context.confidence || 0}) too low for reliable extraction`,
      ROUTE_NOT_FOUND: `No flight duration data for route: ${context.value || 'N/A'}`,
      INVALID_TIME_FORMAT: `Invalid time format: "${context.value || 'N/A'}"${context.requiredFormat ? ` (expected: ${context.requiredFormat})` : ''}`
    };
    
    return messages[code] || `Boarding pass error: ${code}`;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      suggestion: this.context.suggestion
    };
  }
}