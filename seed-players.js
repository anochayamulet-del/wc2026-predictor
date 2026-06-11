const { getDb, prepareGet, prepareRun, prepareAll, saveDb } = require('./db');
const bcrypt = require('bcryptjs');

// 20 ผู้เล่นจำลอง พร้อมทายผลแบบสุ่ม
const fakePlayers = [
  { username: 'SomchaiFC', email: 'somchai@wc2026.com' },
  { username: 'NongBall', email: 'nongball@wc2026.com' },
  { username: 'PeeGoal', email: 'peegoal@wc2026.com' },
  { username: 'KhunFootball', email: 'khunfb@wc2026.com' },
  { username: 'BangkokBoy', email: 'bkkboy@wc2026.com' },
  { username: 'MeoChan', email: 'meochan@wc2026.com' },
  { username: 'ArmChair99', email: 'armchair@wc2026.com' },
  { username: 'GoalHunter', email: 'goalhunter@wc2026.com' },
  { username: 'TopScorer', email: 'topscorer@wc2026.com' },
  { username: 'NakBaan', email: 'nakbaan@wc2026.com' },
  { username: 'CheerThai', email: 'cheerthai@wc2026.com' },
  { username: 'BolaKing', email: 'bolaking@wc2026.com' },
  { username: 'SiamStriker', email: 'siamstriker@wc2026.com' },
  { username: 'PenaltyPro', email: 'penaltypro@wc2026.com' },
  { username: 'WingBack', email: 'wingback@wc2026.com' },
  { username: 'KeeperKub', email: 'keeperkub@wc2026.com' },
  { username: 'OffsideTrap', email: 'offside@wc2026.com' },
  { username: 'FreeKickFC', email: 'freekick@wc2026.com' },
  { username: 'LungFootball', email: 'lungfb@wc2026.com' },
  { username: 'TikiTaka55', email: 'tikitaka@wc2026.com' },
];

// สุ่มสกอร์อย่างสมจริง
function randomScore() {
  const weights = [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5];
  return weights[Math.floor(Math.random() * weights.length)];
}

// ทีมเต็ง (ผู้เล่นบางคนจะเลือกทีมดัง)
const favoriteTeams = [
  'Brazil', 'Argentina', 'France', 'Germany', 'Spain',
  'England', 'Portugal', 'Netherlands', 'Belgium', 'USA'
];

async function seedPlayers() {
  await getDb();

  const password = bcrypt.hashSync('player123', 10);
  const matches = prepareAll('SELECT id FROM matches');

  if (matches.length === 0) {
    console.log('❌ ไม่มีข้อมูลแมตช์ กรุณารัน node seed.js ก่อน');
    return;
  }

  console.log('🎮 กำลังสร้างผู้เล่นจำลอง 20 คน...\n');

  for (const player of fakePlayers) {
    // Check if user already exists
    const existing = prepareGet('SELECT id FROM users WHERE username = ?', [player.username]);
    if (existing) {
      console.log(`  ⏭️  ${player.username} มีอยู่แล้ว`);
      continue;
    }

    // Create user
    const result = prepareRun(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [player.username, player.email, password]
    );
    const userId = result.lastInsertRowid;

    // Create leaderboard entry
    prepareRun('INSERT OR IGNORE INTO leaderboard (user_id, total_points) VALUES (?, 0)', [userId]);

    // สุ่มทายผล 30-60 แมตช์ (ไม่ทุกแมตช์ ให้สมจริง)
    const numPredictions = 30 + Math.floor(Math.random() * 31);
    const shuffledMatches = [...matches].sort(() => Math.random() - 0.5).slice(0, numPredictions);

    for (const match of shuffledMatches) {
      const predictedHome = randomScore();
      const predictedAway = randomScore();

      let predictedResult;
      if (predictedHome > predictedAway) predictedResult = 'home';
      else if (predictedHome < predictedAway) predictedResult = 'away';
      else predictedResult = 'draw';

      try {
        prepareRun(
          'INSERT OR IGNORE INTO predictions (user_id, match_id, predicted_home, predicted_away, predicted_result) VALUES (?, ?, ?, ?, ?)',
          [userId, match.id, predictedHome, predictedAway, predictedResult]
        );
      } catch (e) {}
    }

    // ทายทีมแชมป์
    const champTeam = favoriteTeams[Math.floor(Math.random() * favoriteTeams.length)];
    try {
      prepareRun(
        'INSERT OR IGNORE INTO champion_predictions (user_id, team, round) VALUES (?, ?, ?)',
        [userId, champTeam, 'group']
      );
    } catch (e) {}

    console.log(`  ✅ ${player.username} - ทายผล ${numPredictions} แมตช์, ทายแชมป์: ${champTeam}`);
  }

  saveDb();
  console.log('\n🏁 เสร็จ! สร้างผู้เล่นจำลอง 20 คน พร้อมทายผลแล้ว');
  console.log('💡 ทุกคนใช้รหัสผ่าน: player123');
}

seedPlayers().catch(err => {
  console.error('Seed players failed:', err);
  process.exit(1);
});
