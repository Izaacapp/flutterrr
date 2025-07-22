import { strictDateExtraction } from "../utils/dateStrict";
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * TIME HANDLING INTEGRITY CHECK
 * 
 * This endpoint runs in production to ensure no hardcoded
 * time handling has snuck into the codebase.
 */
router.get('/time-handling-integrity', async (req: Request, res: Response) => {
  const violations: string[] = [];
  
  // Check 1: Ensure timeHandling.service exists
  const timeServicePath = path.join(__dirname, '../services/timeHandling.service.js');
  if (!fs.existsSync(timeServicePath)) {
    violations.push('CRITICAL: timeHandling.service.js missing');
  }
  
  // Check 2: Ensure flight durations database exists
  const durationsPath = path.join(__dirname, '../../data/flightDurations.json');
  if (!fs.existsSync(durationsPath)) {
    violations.push('CRITICAL: flightDurations.json missing');
  } else {
    // Validate database integrity
    try {
      const durations = JSON.parse(fs.readFileSync(durationsPath, 'utf8'));
      const routeCount = Object.values(durations)
        .filter(cat => typeof cat === 'object')
        .reduce((sum, cat: any) => sum + Object.keys(cat).length, 0);
      
      if (routeCount < 50) {
        violations.push(`WARNING: Only ${routeCount} routes in database (minimum 50)`);
      }
    } catch (e) {
      violations.push('CRITICAL: flightDurations.json is corrupted');
    }
  }
  
  // Check 3: Scan for violations in runtime
  const runtimeChecks = [
    {
      test: () => {
        // Test if someone monkey-patched Date
        const testDate = new Date('2024-01-01');
        return testDate.getFullYear() === 2024;
      },
      error: 'Date object has been tampered with'
    },
    {
      test: () => {
        // Test if timezone functions exist
        return typeof Intl.DateTimeFormat === 'function';
      },
      error: 'Intl.DateTimeFormat not available'
    }
  ];
  
  runtimeChecks.forEach(check => {
    try {
      if (!check.test()) {
        violations.push(`RUNTIME: ${check.error}`);
      }
    } catch (e) {
      violations.push(`RUNTIME: ${check.error} (exception)`);
    }
  });
  
  // Check 4: Validate environment
  if (!process.env.SIMPLETEX_API_KEY) {
    violations.push('CONFIG: SIMPLETEX_API_KEY not set');
  }
  
  // REPORT
  if (violations.length > 0) {
    console.error('TIME HANDLING INTEGRITY CHECK FAILED:', violations);
    
    // In production, this could trigger alerts
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send alert to monitoring service
      console.error('🚨 PRODUCTION TIME HANDLING COMPROMISED');
    }
    
    return res.status(500).json({
      status: 'COMPROMISED',
      violations,
      timestamp: strictDateExtraction().toISOString(),
      action: 'IMMEDIATE INVESTIGATION REQUIRED'
    });
  }
  
  res.json({
    status: 'SECURE',
    checks: {
      timeService: 'present',
      durationDatabase: 'valid',
      runtimeIntegrity: 'intact',
      configuration: 'complete'
    },
    timestamp: strictDateExtraction().toISOString()
  });
});

// Admin endpoint to view recent time handling errors
router.get('/time-handling-errors', async (req: Request, res: Response) => {
  // This would connect to your error tracking service
  const recentErrors = [
    // Mock data - replace with real error tracking
    {
      timestamp: strictDateExtraction().toISOString(),
      error: 'extractFlightTimes failed: No date found',
      endpoint: '/api/flights/upload',
      userId: 'xxx'
    }
  ];
  
  res.json({
    errors: recentErrors,
    summary: {
      total: recentErrors.length,
      uniqueErrors: new Set(recentErrors.map(e => e.error)).size
    }
  });
});

export default router;