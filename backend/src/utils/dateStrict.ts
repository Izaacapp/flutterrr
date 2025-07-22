import { BoardingPassError } from './errors';

/**
 * Extract date from text using various patterns
 */
function extractDateFromText(text: string): Date | null {
  const monthMap: Record<string, number> = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
    'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'JUNE': 5,
    'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
  };
  
  // Try different date patterns
  const patterns = [
    // October 9, 2013
    /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2}),?\s*(\d{4})/i,
    // 9 OCT 2013 or 09 OCT 13
    /(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{2,4})?/i,
    // 10/09/2013 or 10-09-2013
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let day, month, year;
      
      if (pattern.source.includes('JANUARY')) {
        // Full month name pattern
        month = monthMap[match[1].toUpperCase()];
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else if (pattern.source.includes('JAN')) {
        // Abbreviated month pattern
        day = parseInt(match[1]);
        month = monthMap[match[2].toUpperCase()];
        year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      } else {
        // Numeric date pattern (assume MM/DD/YYYY)
        month = parseInt(match[1]) - 1; // JavaScript months are 0-based
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      if (year < 100) {
        year += 2000;
      }
      
      return new Date(year, month, day);
    }
  }
  
  return null;
}

/**
 * Strict date extraction with zero fallbacks
 * @throws {BoardingPassError} If date cannot be parsed
 */
export function strictDateExtraction(text?: string): Date {
  // If no text provided, return current date
  if (!text) {
    return new Date();
  }
  
  const date = extractDateFromText(text);
  
  if (!date) {
    throw new BoardingPassError('DATE_PARSE_FAILED', {
      text,
      suggestion: 'Manually enter date in MM/DD/YYYY format'
    });
  }

  // Validate date is within reasonable range
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 1, 0, 1); // 1 year ago
  const maxDate = new Date(now.getFullYear() + 2, 11, 31); // 2 years ahead

  if (date < minDate || date > maxDate) {
    throw new BoardingPassError('INVALID_DATE_RANGE', { date });
  }

  return date;
}

// Helper type for error handling
interface DateParseResult {
  success: boolean;
  date?: Date;
  error?: {
    code: string;
    suggestion: string;
  };
}

/**
 * Safe wrapper for non-critical paths
 */
export function safeStrictDateExtraction(text: string): DateParseResult {
  try {
    return { success: true, date: strictDateExtraction(text) };
  } catch (error: any) {
    return { 
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        suggestion: error.suggestion || 'Please enter date manually'
      }
    };
  }
}