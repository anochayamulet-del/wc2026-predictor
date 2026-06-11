const { getDb, prepareGet, prepareRun, prepareAll, saveDb } = require('./db');

// สุ่มสกอร์อย่างสมจริง
function randomScore() {
  const weights = [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5];
  return weights[Math.floor(Math.random() * weights.length)];
}

async function seedPredictions() {
  await getDb();

  // ดึง user ทั้งหมดที่ไม่ใช่ admin
  const users = prepareAll('SELECT id, username FROM users WHERE is_admin = 0');
  const matches = prepareAll('SELECT id FROM matches');

  if (users.length === 0) {
    console.log('❌ ไม่มีสมาชิก กรุณารัน node seed-players.js ก่อน');
    return;
  }

  if (matches.length === 0) {
    console.log('❌ ไม่มีแมตช์ กรุณารัน node seed.js ก่อน');
    return;
  }

  console.log(`🎲 สุ่มทายผลให้สมาชิก ${users.length} คน (${matches.length} แมตช์)...\n`);

  for (const user of users) {
    // ทายผลครบทุกแมตช์ (72 แมตช์)
    let count = 0;
    for (const match of matches) {
      const predictedHome = randomScore();
      const predictedAway = randomScore();

      let predictedResult;
      if (predictedHome > predictedAway) predictedResult = 'home';
      else if (predictedHome < predictedAway) predictedResult = 'away';
      else predictedResult = 'draw';

      // ใช้ INSERT OR REPLACE เพื่อ overwrite ถ้ามีอยู่แล้ว
      try {
        const existing = prepareGet('SELECT id FROM predictions WHERE user_id = ? AND match_id = ?', [user.id, match.id]);
        if (existing) {
          prepareRun(
            'UPDATE predictions SET predicted_home = ?, predicted_away = ?, predicted_result = ? WHERE user_id = ? AND match_id = ?',
            [predictedHome, predictedAway, predictedResult, user.id, match.id]
          );
        } else {
          prepareRun(
            'INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, predicted_result) VALUES (?, ?, ?, ?, ?)',
            [user.id, match.id, predictedHome, predictedAway, predictedResult]
          );
        }
        count++;
      } catch (e) {}
    }

    console.log(`  ✅ ${user.username} - ทายผล ${count}/${matches.length} แมตช์`);
  }

  saveDb();
  console.log(`\n🏁 เสร็จ! สุ่มทายผลให้ ${users.length} คนเรียบร้อย`);
}

seedPredictions().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
