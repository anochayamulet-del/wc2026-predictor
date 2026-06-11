const { getDb, prepareGet, prepareRun, prepareAll, saveDb } = require('./db');

const favoriteTeams = [
  'Brazil', 'Argentina', 'France', 'Germany', 'Spain',
  'England', 'Portugal', 'Netherlands', 'Belgium', 'USA',
  'Uruguay', 'Colombia', 'Japan', 'South Korea', 'Mexico',
  'Croatia', 'Morocco'
];

async function seedChampion() {
  await getDb();

  const users = prepareAll('SELECT id, username FROM users WHERE is_admin = 0');

  if (users.length === 0) {
    console.log('❌ ไม่มีสมาชิก');
    return;
  }

  console.log(`🏆 สุ่มทายทีมแชมป์ (รอบกลุ่ม) ให้ ${users.length} คน...\n`);

  for (const user of users) {
    const team = favoriteTeams[Math.floor(Math.random() * favoriteTeams.length)];

    const existing = prepareGet('SELECT id FROM champion_predictions WHERE user_id = ? AND round = ?', [user.id, 'group']);
    if (existing) {
      prepareRun("UPDATE champion_predictions SET team = ?, created_at = datetime('now') WHERE user_id = ? AND round = ?", [team, user.id, 'group']);
    } else {
      prepareRun('INSERT INTO champion_predictions (user_id, team, round) VALUES (?, ?, ?)', [user.id, team, 'group']);
    }

    console.log(`  ✅ ${user.username} → ${team}`);
  }

  saveDb();
  console.log('\n🏁 เสร็จ!');
}

seedChampion().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
