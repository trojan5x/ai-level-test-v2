// Test script to verify the scoring scenarios from the handoff document
import { computeLevel, computeRelationshipStatus } from './App.jsx';

// Test scenarios from Section 4.2 of the handoff document
const testScenarios = [
  {
    name: "All wrong, low engagement",
    scores: {
      a1: 0, a2: 1, a3: 0, a4: 1, a5: 1, // total = 3
      item3Correct: false,
      item4Choice: "A",
      item6Level: 1
    },
    expectedLevel: 0,
    expectedRelationship: "single"
  },
  {
    name: "Low engagement",
    scores: {
      a1: 1, a2: 1, a3: 1, a4: 1, a5: 2, // total = 6
      item3Correct: false,
      item4Choice: "B",
      item6Level: 2
    },
    expectedLevel: 1,
    expectedRelationship: "casual"
  },
  {
    name: "Decent but fails Item 3",
    scores: {
      a1: 2, a2: 2, a3: 3, a4: 3, a5: 2, // total = 12
      item3Correct: false,
      item4Choice: "C",
      item6Level: 2
    },
    expectedLevel: 2,
    expectedRelationship: "casual"
  },
  {
    name: "Passes Item 3, picks B on Item 4",
    scores: {
      a1: 2, a2: 2, a3: 4, a4: 2, a5: 4, // total = 14
      item3Correct: true,
      item4Choice: "B",
      item6Level: 3
    },
    expectedLevel: 2,
    expectedRelationship: "committed"
  },
  {
    name: "Passes all gatekeepers",
    scores: {
      a1: 2, a2: 2, a3: 4, a4: 4, a5: 3, // total = 15
      item3Correct: true,
      item4Choice: "C",
      item6Level: 2
    },
    expectedLevel: 3,
    expectedRelationship: "merged"
  },
  {
    name: "Expert, all maxed",
    scores: {
      a1: 3, a2: 3, a3: 4, a4: 4, a5: 5, // total = 19
      item3Correct: true,
      item4Choice: "D",
      item6Level: 4
    },
    expectedLevel: 4,
    expectedRelationship: "merged"
  },
  {
    name: "High total but fails Item 3",
    scores: {
      a1: 3, a2: 3, a3: 4, a4: 4, a5: 4, // total = 18
      item3Correct: false,
      item4Choice: "C",
      item6Level: 3
    },
    expectedLevel: 2,
    expectedRelationship: "committed"
  }
];

console.log('🧪 Running Scoring Verification Tests...\n');

testScenarios.forEach((scenario, index) => {
  const actualLevel = computeLevel(scenario.scores);
  const actualRelationship = computeRelationshipStatus(scenario.scores, actualLevel);
  
  const levelPassed = actualLevel === scenario.expectedLevel;
  const relationshipPassed = actualRelationship === scenario.expectedRelationship;
  
  console.log(`Test ${index + 1}: ${scenario.name}`);
  console.log(`  Level: ${actualLevel} ${levelPassed ? '✅' : `❌ (expected ${scenario.expectedLevel})`}`);
  console.log(`  Relationship: ${actualRelationship} ${relationshipPassed ? '✅' : `❌ (expected ${scenario.expectedRelationship})`}`);
  console.log(`  Overall: ${levelPassed && relationshipPassed ? '✅ PASS' : '❌ FAIL'}\n`);
});