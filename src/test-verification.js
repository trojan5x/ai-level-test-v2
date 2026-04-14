// Quick test script to verify key functionality
// Run this in browser console at http://localhost:5175/

console.log('🧪 AI Level Test - Quick Verification');

// Test 1: L4+ Display Logic
console.log('\n📊 Testing L4+ Display Logic:');
const testDisplayLevel = (level) => {
  const display = level >= 4 ? "4+" : String(level);
  console.log(`Level ${level} → Display: "${display}"`);
  return display;
};

[0, 1, 2, 3, 4, 5, 6].forEach(testDisplayLevel);

// Test 2: Scoring Engine
console.log('\n🎯 Testing Scoring Scenarios:');
const testScenarios = [
  {
    name: "Expert, all maxed",
    scores: {
      a1: 3, a2: 3, a3: 4, a4: 4, a5: 5, // total = 19
      item3Correct: true,
      item4Choice: "D",
      item6Level: 4
    },
    expected: 4
  },
  {
    name: "High total but fails Item 3",
    scores: {
      a1: 3, a2: 3, a3: 4, a4: 4, a5: 4, // total = 18
      item3Correct: false,
      item4Choice: "C",
      item6Level: 3
    },
    expected: 2
  }
];

// If computeLevel is available globally, test it
if (typeof window !== 'undefined' && window.computeLevel) {
  testScenarios.forEach(scenario => {
    const result = window.computeLevel(scenario.scores);
    const passed = result === scenario.expected;
    console.log(`${scenario.name}: ${result} ${passed ? '✅' : '❌'} (expected ${scenario.expected})`);
  });
} else {
  console.log('⚠️ computeLevel not available globally - manual testing needed');
}

// Test 3: Mobile viewport simulation
console.log('\n📱 Simulating iPhone SE viewport (375x667):');
const originalWidth = window.innerWidth;
const originalHeight = window.innerHeight;

// Apply mobile styles for testing
document.documentElement.style.width = '375px';
document.documentElement.style.height = '667px';
document.body.style.width = '375px';
document.body.style.height = '667px';

console.log('✅ Mobile viewport applied. Check UI elements manually.');
console.log('To reset: document.documentElement.style.width = ""; document.documentElement.style.height = "";');

// Test 4: Analytics/Supabase Integration
console.log('\n📊 Testing Analytics:');
if (typeof window !== 'undefined' && window.trackAnalyticsEvent) {
  window.trackAnalyticsEvent('test_verification', { timestamp: new Date().toISOString() });
  console.log('✅ Analytics event sent');
} else {
  console.log('⚠️ trackAnalyticsEvent not available - check import');
}

console.log('\n🎉 Verification script complete. Check above results.');
console.log('Next: Navigate through the assessment to test the full flow.');