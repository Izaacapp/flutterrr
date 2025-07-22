/**
 * Boarding Pass Validation Demo
 * 
 * This demonstrates how the comprehensive validation layer improves OCR results
 */

import { validateBoardingPass } from '../utils/boardingPassValidator';

console.log(`
🛫 BOARDING PASS VALIDATION DEMO 🛫
===================================

This demo shows how our validation layer turns SimpleTex OCR output into 
validated, corrected boarding pass data.
`);

// Demo 1: Perfect boarding pass
console.log('📋 Demo 1: Clean Boarding Pass');
console.log('Input: "DELTA DL1234 LAX TO JFK DEPART 15:30 SEAT 12A"');
const demo1 = validateBoardingPass('DELTA DL1234 LAX TO JFK DEPART 15:30 SEAT 12A');
console.log('Output:', demo1.extractedData);
console.log('');

// Demo 2: OCR errors with corrections
console.log('🔧 Demo 2: OCR Errors (Auto-Corrected)');
console.log('Input: "DZ1234 IAX TO JEK DEPART 25:30"');
console.log('       ^^wrong airline  ^^wrong airports  ^^invalid time');
const demo2 = validateBoardingPass('DZ1234 IAX TO JEK DEPART 25:30');
console.log('Corrections:');
console.log('  Flight:', demo2.validations.flightNumber.suggestion);
console.log('  Origin:', demo2.validations.airports.origin.suggestion);
console.log('  Time:', demo2.validations.departureTime.value);
console.log('Final Output:', demo2.extractedData);
console.log('');

// Demo 3: Low confidence filtering
console.log('🔍 Demo 3: Confidence Filtering');
const demo3Input = {
  text: 'DL1234 DEP 15:30 LAX→JFK',
  confidence: [
    { word: 'DL1234', confidence: 0.95 },
    { word: 'DEP', confidence: 0.80 },
    { word: '15:30', confidence: 0.60 },  // Too blurry
    { word: 'LAX→JFK', confidence: 0.40 } // Symbol corrupted
  ]
};
const demo3 = validateBoardingPass(demo3Input);
console.log('High confidence text only:', demo3.cleanText);
console.log('Extracted:', demo3.extractedData);
console.log('');

// Demo 4: Complex real-world example
console.log('🌍 Demo 4: Real-World Boarding Pass');
const realWorldPass = `
BOARDING PASS
NAME: SMITH/JOHN
FLIGHT: FR1234
FROM: DUB TO: BCN
DATE: 15 MAR 2024
BOARDING: 06:00
DEPARTURE: 06:30
ARRIVAL: 10:15
SEAT: 15F
GATE: A12
`;
const demo4 = validateBoardingPass(realWorldPass);
console.log('Extracted Data:');
console.log(JSON.stringify(demo4.extractedData, null, 2));
console.log('');

// Summary comparison
console.log(`
📊 COMPARISON SUMMARY
====================
Problem             SimpleTex Alone    Our Solution
-----------------   ---------------    ---------------
Blurry text         Returns garbage    Drops low-confidence
Wrong airline       "DZ1234" passes    Auto-corrects to DL1234  
Invalid times       "25:70" passes     Forces valid time
Missing structure   Raw text           Validated JSON
`);

// API endpoints
console.log(`
🔌 API ENDPOINTS
================
POST /api/boarding-pass/validate/text
  - Validates text input
  - Returns structured data with corrections

POST /api/boarding-pass/validate/image  
  - Processes boarding pass images
  - Uses SimpleTex OCR + validation layer

GET /api/boarding-pass/airlines
  - Returns ${Object.keys(require('../utils/boardingPassValidator').testHelpers.AIRLINE_CODES).length} supported airline codes

GET /api/boarding-pass/airports
  - Returns ${require('../utils/boardingPassValidator').testHelpers.COMMON_AIRPORTS.size} common airport codes
`);

export { demo1, demo2, demo3, demo4 };