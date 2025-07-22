import { safeStrictDateExtraction } from "../utils/dateStrict";
import { parseBoardingPassV2 } from '../utils/boardingPassParserV2';

// Sample boarding pass text that includes gate information
const sampleBoardingPassTexts = [
  // Sample 1: United Airlines
  `UNITED AIRLINES
   DOE/JOHN              EAGZ7TR
   FROM: CHICAGO ORD     TO: LOS ANGELES LAX
   FLIGHT: UA456         DATE: 15 AUG 2025
   
   GATE: C10             BOARDING TIME: 5:45PM
   SEAT: 21A             GROUP: 2
   
   DEPARTURE: 6:30PM     ARRIVAL: 8:55PM`,
   
  // Sample 2: Delta Airlines
  `DELTA AIR LINES
   BOARDING PASS
   
   SMITH/JANE
   CONF: ABC123
   
   DL198  21 DEC 25  11:40
   ATL               MIA
   
   Gate A15  Boarding till: 11:10  Seat 12B
   Zone 3`,
   
  // Sample 3: Common table format
  `Name: JOHNSON/ROBERT
   Booking Reference: XYZ789
   
   Flight  Date        Time    From  To
   AA2345  06 MAR 25  14:30   DFW   ORD
   
   Terminal D  Gate D24
   Seat 5C  Boarding Group 1
   Boarding begins at 13:45`
];

async function testParser() {
  console.log('🧪 Testing Boarding Pass Parser V2\n');
  
  for (let i = 0; i < sampleBoardingPassTexts.length; i++) {
    console.log(`\n📄 TEST CASE ${i + 1}`);
    console.log('=' .repeat(50));
    
    // Convert text to buffer to simulate OCR output
    const buffer = Buffer.from(sampleBoardingPassTexts[i]);
    
    try {
      const result = await parseBoardingPassV2(buffer, 'text/plain');
      
      if (result) {
        console.log('✅ PARSE SUCCESS');
        console.log('\n🎫 Flight Info:');
        console.log(`  Airline: ${result.flight.airline.name} (${result.flight.airline.iataCode})`);
        console.log(`  Flight: ${result.flight.flightNumber}`);
        console.log(`  Route: ${result.flight.departure.airportCode} → ${result.flight.arrival.airportCode}`);
        
        console.log('\n🚪 TERMINAL INFO:');
        console.log(`  Terminal: ${result.flight.departure.terminal || 'Not found'}`);
        
        console.log('\n👤 Passenger:');
        console.log(`  Name: ${result.passenger.name.firstName} ${result.passenger.name.lastName}`);
        console.log(`  PNR: ${result.passenger.pnrCode || 'Not found'}`);
        console.log(`  Seat: ${result.boardingInfo.seatNumber}`);
        console.log(`  Group: ${result.boardingInfo.boardingGroup || 'Not found'}`);
      } else {
        console.log('❌ PARSE FAILED');
      }
    } catch (error) {
      console.log('❌ ERROR:', error);
    }
  }
}

// Run the test
testParser().catch(console.error);