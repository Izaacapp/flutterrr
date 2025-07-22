/**
 * Comprehensive Boarding Pass Validation Example
 * 
 * This example demonstrates how our validation layer improves SimpleTex OCR results
 * by handling confidence scores, airline validation, and time/date corrections.
 */

import { validateBoardingPass } from '../utils/boardingPassValidator';

// Example 1: Blurry text with low confidence
console.log('=== Example 1: Blurry Text with Confidence Scores ===');
const blurryTextResult = {
  text: 'DL1234 DEP 15:30 LAX→JFK',
  confidence: [
    { word: 'DL1234', confidence: 0.95 },
    { word: 'DEP', confidence: 0.80 },
    { word: '15:30', confidence: 0.60 },  // Low confidence due to blur
    { word: 'LAX→JFK', confidence: 0.40 } // Arrow symbol messed up
  ]
};

const validation1 = validateBoardingPass(blurryTextResult);
console.log('Clean text:', validation1.cleanText);
console.log('Extracted data:', validation1.extractedData);

// Example 2: Wrong airline code
console.log('\n=== Example 2: Wrong Airline Code ===');
const wrongAirlineResult = validateBoardingPass('DZ1234 DEPART 14:30 JFK TO LAX');
console.log('Flight validation:', wrongAirlineResult.validations.flightNumber);
console.log('Corrected flight:', wrongAirlineResult.extractedData.flightNumber);

// Example 3: Invalid time
console.log('\n=== Example 3: Invalid Time ===');
const invalidTimeResult = validateBoardingPass('UA456 DEPARTURE 25:70 SFO-ORD');
console.log('Time validation:', invalidTimeResult.validations.departureTime);
console.log('Corrected time:', invalidTimeResult.extractedData.departureTime);

// Example 4: Full boarding pass with multiple issues
console.log('\n=== Example 4: Full Boarding Pass with Issues ===');
const complexExample = `
DEITA AIRLINES
FLIGHT: DZ1234
FROM: IAX TO: JEK
DATE: OCTOBER 32, 2024
DEPARTURE TIME: 25:30
ARRIVAL TIME: 27:80
SEAT: 99Z
GATE: B999
`;

const validation4 = validateBoardingPass(complexExample);
console.log('All validations:', JSON.stringify(validation4.validations, null, 2));
console.log('Final extracted data:', JSON.stringify(validation4.extractedData, null, 2));

// Example 5: Real-world Delta boarding pass
console.log('\n=== Example 5: Real Delta Boarding Pass ===');
const deltaPass = `
DELTA AIR LINES
NAME: JOHN DOE
FLIGHT: DL1234
FROM: LAX TO: JFK
DATE: 15 OCT 2024
BOARDING TIME: 10:15AM
DEPARTURE TIME: 10:45AM
ARRIVAL TIME: 7:30PM
SEAT: 24A
GATE: B12
CONFIRMATION: ABC123
`;

const validation5 = validateBoardingPass(deltaPass);
console.log('Delta pass validation:', {
  flightNumber: validation5.extractedData.flightNumber,
  route: `${validation5.extractedData.origin} → ${validation5.extractedData.destination}`,
  times: {
    boarding: validation5.extractedData.boardingTime,
    departure: validation5.extractedData.departureTime,
    arrival: validation5.extractedData.arrivalTime
  },
  seat: validation5.extractedData.seat,
  gate: validation5.extractedData.gate
});

// Example 6: Ryanair boarding pass (European format)
console.log('\n=== Example 6: Ryanair Boarding Pass ===');
const ryanairPass = `
RYANAIR
FR1234 15MAR
DUB-BCN
DEPART 06:30
ARRIVE 10:15
BOARDING 06:00
SEAT 15F
`;

const validation6 = validateBoardingPass(ryanairPass);
console.log('Ryanair validation:', validation6.extractedData);

// Summary comparison table
console.log('\n=== COMPARISON TABLE ===');
console.log('Problem          | SimpleTex Alone | Our Solution');
console.log('-----------------|-----------------|---------------');
console.log('Blurry text      | Returns garbage | Drops low-confidence');
console.log('Wrong airline    | "DZ1234" passes | Auto-corrects to DL1234');
console.log('Invalid times    | "25:70" passes  | Forces valid time');
console.log('No structure     | Raw text        | Validated JSON');

// Performance metrics
console.log('\n=== PERFORMANCE METRICS ===');
const testCases = [
  'DL1234 LAX-JFK 15:30',
  'UA456 ORD-DEN 14:45PM',
  'FR789 DUB-BCN 06:30',
  'BA101 LHR-JFK 10:15AM',
  'AA222 MIA-LAX 23:45'
];

const startTime = Date.now();
testCases.forEach(testCase => validateBoardingPass(testCase));
const endTime = Date.now();

console.log(`Processed ${testCases.length} boarding passes in ${endTime - startTime}ms`);
console.log(`Average: ${(endTime - startTime) / testCases.length}ms per pass`);

// Export for use in other examples
export { validation1, validation4, validation5 };