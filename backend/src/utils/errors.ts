/**
 * Custom error class for boarding pass validation errors
 */
export class BoardingPassError extends Error {
  code: string;
  details?: any;
  suggestion?: string;

  constructor(code: string, details?: any) {
    super(`Boarding pass error: ${code}`);
    this.name = 'BoardingPassError';
    this.code = code;
    this.details = details;
    this.suggestion = details?.suggestion;
  }
}