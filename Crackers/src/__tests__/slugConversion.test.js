/**
 * Slug Conversion Tests
 * Tests for category slug conversion and URL routing
 */

// Helper functions
const slugify = (text) => (text || '').toString().toLowerCase().replace(/\s+/g, '-');

const unslugify = (slug) => {
  if (!slug) return 'All';
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Test Suite
const tests = [
  {
    name: 'slugify: Single word',
    input: 'Fountains',
    expected: 'fountains',
    fn: () => slugify('Fountains')
  },
  {
    name: 'slugify: Multi-word with spaces',
    input: 'Night Time',
    expected: 'night-time',
    fn: () => slugify('Night Time')
  },
  {
    name: 'slugify: Multiple spaces',
    input: 'Gift   Boxes',
    expected: 'gift-boxes',
    fn: () => slugify('Gift   Boxes')
  },
  {
    name: 'slugify: Empty string',
    input: '',
    expected: '',
    fn: () => slugify('')
  },
  {
    name: 'unslugify: Single word',
    input: 'fountains',
    expected: 'Fountains',
    fn: () => unslugify('fountains')
  },
  {
    name: 'unslugify: Multi-word slug',
    input: 'night-time',
    expected: 'Night Time',
    fn: () => unslugify('night-time')
  },
  {
    name: 'unslugify: Day Time slug',
    input: 'day-time',
    expected: 'Day Time',
    fn: () => unslugify('day-time')
  },
  {
    name: 'unslugify: Gift Boxes slug',
    input: 'gift-boxes',
    expected: 'Gift Boxes',
    fn: () => unslugify('gift-boxes')
  },
  {
    name: 'unslugify: Empty/null slug',
    input: '',
    expected: 'All',
    fn: () => unslugify('')
  },
  {
    name: 'Round trip: Night Time',
    input: 'Night Time',
    expected: 'Night Time',
    fn: () => {
      const slug = slugify('Night Time');
      return unslugify(slug);
    }
  },
  {
    name: 'Round trip: Flower Pots',
    input: 'Flower Pots',
    expected: 'Flower Pots',
    fn: () => {
      const slug = slugify('Flower Pots');
      return unslugify(slug);
    }
  },
  {
    name: 'Case insensitivity check',
    input: 'NIGHT TIME',
    expected: 'night-time',
    fn: () => slugify('NIGHT TIME')
  }
];

// Run tests
console.log('🧪 Starting Slug Conversion Tests...\n');
console.log('═'.repeat(60));

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = test.fn();
  const isPass = result === test.expected;
  
  if (isPass) {
    passed++;
    console.log(`✅ PASS: ${test.name}`);
    console.log(`   Input: "${test.input}" → Result: "${result}"`);
  } else {
    failed++;
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: "${test.expected}"`);
    console.log(`   Got: "${result}"`);
  }
  console.log('');
});

console.log('═'.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
console.log(`✅ Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
} else {
  console.log(`⚠️  ${failed} test(s) failed. Check the logs above.`);
}
