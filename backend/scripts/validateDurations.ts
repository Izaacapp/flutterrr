import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import * as fs from 'fs';
import * as path from 'path';

const MIN_DURATION = 0.5;  // 30 minutes
const MAX_DURATION = 20;   // 20 hours

interface DurationDatabase {
  [category: string]: {
    [route: string]: number;
  };
}

function validateFlightDurations(): void {
  console.log('🔍 Validating flight duration database...\n');
  
  const dbPath = path.join(__dirname, '../data/flightDurations.json');
  const durations: DurationDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  
  let totalRoutes = 0;
  let errors: string[] = [];
  
  for (const [category, routes] of Object.entries(durations)) {
    if (category === 'defaults') continue;
    
    console.log(`Checking ${category}...`);
    
    for (const [route, hours] of Object.entries(routes)) {
      totalRoutes++;
      
      // Validate duration range
      if (hours < MIN_DURATION || hours > MAX_DURATION) {
        errors.push(`❌ Invalid duration for ${route}: ${hours}h (must be ${MIN_DURATION}-${MAX_DURATION}h)`);
      }
      
      // Validate route format
      if (!route.match(/^[A-Z]{3}-[A-Z]{3}$/)) {
        errors.push(`❌ Invalid route format: ${route} (must be XXX-YYY)`);
      }
      
      // Check for reverse route consistency
      const [origin, dest] = route.split('-');
      const reverseRoute = `${dest}-${origin}`;
      const reverseTime = routes[reverseRoute];
      
      if (reverseTime && Math.abs(hours - reverseTime) > 2) {
        errors.push(`⚠️  Large difference between ${route} (${hours}h) and ${reverseRoute} (${reverseTime}h)`);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total routes: ${totalRoutes}`);
  console.log(`   Errors found: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 Errors:');
    errors.forEach(error => console.log(error));
    process.exit(1);
  } else {
    console.log('\n✅ All flight durations are valid!');
  }
}

// Run validation
validateFlightDurations();