#!/usr/bin/env node

const { execSync } = require('child_process');
const open = require('open');

// Common mobile device viewports
const devices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 14 Plus', width: 428, height: 926 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
];

console.log('🚀 Starting responsive testing environment...\n');

// Check if the web server is running
try {
  execSync('curl -s http://localhost:5173 > /dev/null', { stdio: 'ignore' });
  console.log('✅ Web server is already running on port 5173');
} catch {
  console.log('⚠️  Web server not detected. Please run "npm run dev" in the web directory first.');
  process.exit(1);
}

console.log('\n📱 Mobile Testing Guide:');
console.log('========================\n');

console.log('To test responsive design in Chrome:');
console.log('1. Open Chrome DevTools (F12 or Cmd+Option+I)');
console.log('2. Click the device toggle (Ctrl+Shift+M or Cmd+Shift+M)');
console.log('3. Select a device from the dropdown or use these dimensions:\n');

devices.forEach(device => {
  console.log(`   ${device.name}: ${device.width}x${device.height}`);
});

console.log('\n📋 Testing Checklist:');
console.log('===================\n');
console.log('[ ] Navigation menu works on mobile');
console.log('[ ] Forms are properly sized and accessible');
console.log('[ ] Images scale correctly');
console.log('[ ] Text is readable without zooming');
console.log('[ ] Touch targets are appropriately sized (min 44x44px)');
console.log('[ ] Horizontal scrolling is not required');
console.log('[ ] Modals and popups fit within viewport');
console.log('[ ] Loading states are visible');
console.log('[ ] Error states are properly displayed');

console.log('\n🔍 Key Areas to Test:');
console.log('====================\n');
console.log('1. Login/Register flow');
console.log('2. Home feed scrolling');
console.log('3. Create post functionality');
console.log('4. Profile page layout');
console.log('5. Image uploads and previews');
console.log('6. Navigation between pages');

console.log('\n🌐 Opening web app in browser...\n');

// Open the app in the default browser
open('http://localhost:5173');

console.log('💡 Tip: Use Chrome\'s Network throttling to test on slower connections');
console.log('💡 Tip: Test both portrait and landscape orientations\n');