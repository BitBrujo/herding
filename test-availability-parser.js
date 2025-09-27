// Quick test for the availability parser
// Run with: node test-availability-parser.js

import { parseMultipleStatements } from './src/lib/availability-parser.ts';

// Mock event context for testing
const testEventContext = {
  startDate: '2025-01-20',
  endDate: '2025-01-22',
  startTime: '09:00:00',
  endTime: '17:00:00',
  participantName: 'Test User',
  eventTitle: 'Test Meeting'
};

// Test cases
const testCases = [
  "I can't do mornings",
  "Tuesday at 2 PM works for me",
  "I prefer afternoons",
  "Weekends don't work for me",
  "I'm available Tuesday and Wednesday afternoons",
  "I can't do Monday or Friday",
  "I prefer early afternoon around 1 PM",
  "I'm busy in the morning but free after lunch"
];

console.log('Testing Availability Parser\n');
console.log('Event Context:', testEventContext);
console.log('\n' + '='.repeat(80) + '\n');

for (const testCase of testCases) {
  console.log(`Input: "${testCase}"`);

  try {
    const result = parseMultipleStatements(testCase, testEventContext);

    console.log(`Output:`);
    console.log(`  - Updates: ${result.updates.length} time slots`);
    console.log(`  - Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`  - Summary: ${result.summary}`);

    if (result.updates.length > 0 && result.updates.length <= 5) {
      console.log(`  - Sample updates:`);
      result.updates.slice(0, 3).forEach(update => {
        console.log(`    * ${update.date} at ${update.time}: ${update.status}`);
      });
    }

  } catch (error) {
    console.log(`  - ERROR: ${error.message}`);
  }

  console.log('\n' + '-'.repeat(40) + '\n');
}

console.log('Test completed.');