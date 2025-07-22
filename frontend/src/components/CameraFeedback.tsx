import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface CameraFeedbackProps {
  ocrText: string;
  onValidation: (isValid: boolean, issues: ValidationIssue[]) => void;
}

export const CameraFeedback: React.FC<CameraFeedbackProps> = ({ ocrText, onValidation }) => {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!ocrText) {
      setIssues([]);
      return;
    }

    validateBoardingPass(ocrText);
  }, [ocrText]);

  const validateBoardingPass = async (text: string) => {
    setIsValidating(true);
    const newIssues: ValidationIssue[] = [];

    // Check for date
    if (!extractDate(text)) {
      newIssues.push({
        field: 'date',
        message: 'DATE NOT FOUND - Point camera at date',
        severity: 'error'
      });
    }

    // Check for departure time
    if (!extractTime(text, 'departure')) {
      newIssues.push({
        field: 'departureTime',
        message: 'DEPARTURE TIME MISSING',
        severity: 'error'
      });
    }

    // Check for airports
    const airports = extractAirports(text);
    if (airports.length < 2) {
      newIssues.push({
        field: 'airports',
        message: 'NEED BOTH AIRPORTS (FROM/TO)',
        severity: 'error'
      });
    }

    // Check for flight number
    if (!extractFlightNumber(text)) {
      newIssues.push({
        field: 'flightNumber',
        message: 'Flight number recommended',
        severity: 'warning'
      });
    }

    setIssues(newIssues);
    onValidation(newIssues.filter(i => i.severity === 'error').length === 0, newIssues);
    setIsValidating(false);
  };

  const extractDate = (text: string): boolean => {
    const datePatterns = [
      /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/,
      /\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i,
      /(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2}/i
    ];
    return datePatterns.some(pattern => pattern.test(text));
  };

  const extractTime = (text: string, type: string): boolean => {
    const timePattern = /\d{1,2}:\d{2}\s*[AP]?M?/i;
    const contextPattern = new RegExp(`${type}|dep|leaves`, 'i');
    return timePattern.test(text) && (type === 'any' || contextPattern.test(text));
  };

  const extractAirports = (text: string): string[] => {
    const matches = text.match(/\b[A-Z]{3}\b/g) || [];
    return [...new Set(matches)];
  };

  const extractFlightNumber = (text: string): boolean => {
    return /\b[A-Z]{2}\s*\d{1,4}\b/.test(text);
  };

  const hasErrors = issues.some(i => i.severity === 'error');
  const bgColor = hasErrors ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500';
  const textColor = hasErrors ? 'text-red-800' : 'text-green-800';

  return (
    <div className={`fixed bottom-20 left-4 right-4 p-4 rounded-lg border-2 ${bgColor} transition-all duration-300 ${isValidating ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
          <span className={`font-bold ${textColor}`}>
            {hasErrors ? 'FIX THESE ISSUES:' : 'LOOKS GOOD!'}
          </span>
        </div>
        {isValidating && (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
      </div>
      
      {issues.length > 0 && (
        <ul className="space-y-1">
          {issues.map((issue, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <AlertCircle className={`w-4 h-4 mt-0.5 ${issue.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
              <span className={`text-sm ${issue.severity === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
                {issue.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!hasErrors && ocrText && (
        <div className="text-sm text-green-700">
          ✓ Date found<br />
          ✓ Times detected<br />
          ✓ Airports identified
        </div>
      )}
    </div>
  );
};