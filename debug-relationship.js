// Debug Test 2 relationship status calculation
function debugRelationshipStatus() {
  const scores = {
    a1: 1, a2: 1, a3: 1, a4: 2, a5: 1, // total = 6
    item3Correct: false,
    item4Choice: "B", 
    item6Level: 2,
    restraintScore: 0,
  };
  const level = 1;

  console.log('🔍 Debugging Test 2 Relationship Status:');
  console.log('Scores:', scores);
  console.log('Level:', level);

  const petSignals = [
    !scores.item3Correct,        // true (wrong on Item 3)
    scores.restraintScore === 0, // true (no restraint)
    scores.item4Choice === "A",  // false (chose B, not A)
  ].filter(Boolean);
  
  const colleagueSignals = [
    scores.item3Correct,                                   // false
    scores.item4Choice === "C" || scores.item4Choice === "D", // false
    scores.restraintScore >= 2,                            // false
    scores.item6Level >= 3,                                // false
  ].filter(Boolean);

  console.log('Pet signals:', petSignals, '(count:', petSignals.length, ')');
  console.log('Colleague signals:', colleagueSignals, '(count:', colleagueSignals.length, ')');

  // Logic flow:
  console.log('\nLogic checks:');
  console.log('level >= 3 && petSignals >= 2:', level >= 3 && petSignals.length >= 2);
  console.log('level <= 1 && colleagueSignals >= 2:', level <= 1 && colleagueSignals.length >= 2);
  console.log('level >= 3 && colleagueSignals >= 3:', level >= 3 && colleagueSignals.length >= 3);
  console.log('colleagueSignals >= 2 && level >= 2:', colleagueSignals.length >= 2 && level >= 2);
  console.log('level === 0:', level === 0);
  console.log('petSignals >= 2:', petSignals.length >= 2);

  // Expected result per handoff: level 1 should be "casual"
  // Current logic returns "complicated" because petSignals >= 2
  console.log('\nIssue: petSignals >= 2 (2) triggers "complicated" for level 1');
  console.log('But handoff document expects "casual" for low engagement scenario');
}

debugRelationshipStatus();