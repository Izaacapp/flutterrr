#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// BANNED PATTERNS - ZERO TOLERANCE
const BANNED_PATTERNS = [
  {
    pattern: /new\s+Date\(\)/g,
    message: '❌ BANNED: new Date() without arguments',
    suggestion: 'Use extractDate() or throw an error'
  },
  {
    pattern: /\.getTime\(\)\s*\+\s*\d+\s*\*\s*3600/g,
    message: '❌ BANNED: Hardcoded hour math',
    suggestion: 'Use estimateArrivalTime() from timeHandling.service'
  },
  {
    pattern: /setHours\(\d+,\s*\d+,\s*\d+,\s*\d+\)/g,
    message: '❌ BANNED: Raw time setting without timezone',
    suggestion: 'Use parseZonedDateTime() with airport timezone'
  },
  {
    pattern: /\d+\s*\*\s*60\s*\*\s*60\s*\*\s*1000/g,
    message: '❌ BANNED: Hardcoded duration calculation',
    suggestion: 'Use FLIGHT_DURATIONS database'
  },
  {
    pattern: /minutes\s*===?\s*(70|80)/g,
    message: '❌ BANNED: Hardcoded OCR corrections',
    suggestion: 'Use correctOcrTime() with confidence scores'
  },
  {
    pattern: /Date\.now\(\)\s*\+/g,
    message: '❌ BANNED: Adding to current time',
    suggestion: 'Use proper date arithmetic with timezones'
  },
  {
    pattern: /moment\(\)\.add/g,
    message: '❌ BANNED: Moment.js without timezone',
    suggestion: 'Use moment.tz() or native Intl.DateTimeFormat'
  }
];

// FILES TO SCAN
const SCAN_DIRECTORIES = [
  'src',
  'scripts'
];

const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'time-handling-audit.js',
  'timeHandling.service.ts', // Our blessed service
  'flightDurations.json'
];

let violationsFound = 0;
const violations = [];

function scanFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  BANNED_PATTERNS.forEach(({ pattern, message, suggestion }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        // Skip if marked as allowed
        if (line.includes('// ALLOWED') || line.includes('// BLESSED')) return;
        
        violationsFound++;
        violations.push({
          file: filePath,
          line: index + 1,
          code: line.trim(),
          message,
          suggestion
        });
      }
    });
  });
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_PATTERNS.includes(file)) {
        scanDirectory(fullPath);
      }
    } else {
      scanFile(fullPath);
    }
  });
}

// MAIN EXECUTION
console.log('🔍 TIME HANDLING AUDIT - ZERO TOLERANCE MODE\n');

// Change to backend directory
const backendDir = path.resolve(__dirname, '..');
process.chdir(backendDir);

// Scan all directories
SCAN_DIRECTORIES.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Scanning ${dir}...`);
    scanDirectory(dir);
  }
});

// REPORT VIOLATIONS
if (violationsFound > 0) {
  console.log(`\n🚨 TIME CRIMES DETECTED: ${violationsFound} VIOLATIONS\n`);
  
  violations.forEach(v => {
    console.log(`${v.file}:${v.line}`);
    console.log(`  ${v.message}`);
    console.log(`  Code: ${v.code}`);
    console.log(`  Fix: ${v.suggestion}\n`);
  });
  
  // DEVELOPER SHAMING
  try {
    const gitUser = execSync('git config user.name', { encoding: 'utf8' }).trim();
    console.log(`\n👮 ATTENTION ${gitUser.toUpperCase()}:`);
    console.log('Your commit has been REJECTED for time handling violations.');
    console.log('Fix these issues or face mandatory code review!\n');
  } catch (e) {
    // Git not configured
  }
  
  // CREATE REPORT FILE
  const reportPath = path.join(backendDir, 'TIME_VIOLATIONS_REPORT.txt');
  const report = violations.map(v => 
    `${v.file}:${v.line}\n${v.message}\n${v.code}\nFIX: ${v.suggestion}\n`
  ).join('\n---\n\n');
  
  fs.writeFileSync(reportPath, 
    `TIME HANDLING VIOLATIONS REPORT\n` +
    `Generated: ${new Date().toISOString()}\n` +
    `Total Violations: ${violationsFound}\n\n` +
    report
  );
  
  console.log(`📄 Detailed report saved to: TIME_VIOLATIONS_REPORT.txt`);
  
  process.exit(1);
} else {
  console.log('\n✅ NO TIME HANDLING VIOLATIONS FOUND!');
  console.log('Your code passes the zero-tolerance time handling audit.\n');
  process.exit(0);
}