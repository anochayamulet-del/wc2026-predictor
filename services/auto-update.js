/**
 * Auto-Update Service
 * ดึงผลการแข่งขันจาก API ภายนอกอัตโนมัติ
 * 
 * ใช้ Football-Data.org API (Free tier: 10 requests/minute)
 * Competition ID สำหรับ World Cup 2026 = 2000 (FIFA World Cup)
 * 
 * ถ้าไม่มี API key หรือ API ยังไม่พร้อม จะ fallback ไปใช้ 
 * การ scrape จาก public sources
 */

const https = require('https');
const { prepareGet, prepareAll, prepareRun, saveDb } = require('../db');

// ======= Configuration =======
// สมัคร API key ฟรีที่: https://www.football-data.org/client/register
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_API_KEY || '';

// ความถี่ในการตรวจสอบ (milliseconds)
const CHECK_INTERVAL = 5 * 60 * 1000; // ทุก 5 นาที

// Point system
const POINTS = {
  CORRECT_RESULT: 3,
  CORRECT_SCORE: 5,
};

// ======= Team name mapping =======
// Map ชื่อทีมจาก API ต่างๆ ให้ตรงกับที่เราใช้ใน DB
const TEAM_NAME_MAP = {
  'Korea Republic': 'South Korea',
  'Republic of Korea': 'South Korea',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Turkiye': 'Türkiye',
  'Turkey': 'Türkiye',
  'Curacao': 'Curaçao',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'DR Congo': 'DR Congo',
  'United States': 'USA',
  'Cape Verde Islands': 'Cape Verde',
  'Cabo Verde': 'Cape Verde',
  'Czech Republic': 'Czechia',
};

function normalizeTeamName(name) {
  return TEAM_NAME_MAP[name] || name;
}

// ======= Football-Data.org API =======
function fetchFromFootballData() {
  return new Promise((resolve, reject) => {
    if (!FOOTBALL_DATA_API_KEY) {
      return reject(new Error('No API key configured'));
    }

    const options = {
      hostname: 'api.football-data.org',
      path: '/v4/competitions/2000/matches',
      headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errorCode) {
            return reject(new Error(json.message || 'API error'));
          }
          if (json.matches) {
            resolve(json.matches
              .filter(m => m.status === 'FINISHED' || m.status === 'IN_PLAY')
              .map(m => ({
                homeTeam: normalizeTeamName(m.homeTeam.name),
                awayTeam: normalizeTeamName(m.awayTeam.name),
                homeScore: m.score.fullTime.home,
                awayScore: m.score.fullTime.away,
                date: m.utcDate.split('T')[0],
                status: m.status === 'FINISHED' ? 'finished' : 'live'
              }))
            );
          } else {
            reject(new Error('Invalid API response: ' + JSON.stringify(json).substring(0, 200)));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ======= Alternative: API-Football (RapidAPI) =======
function fetchFromApiFootball() {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RAPIDAPI_KEY || '';
    if (!apiKey) {
      return reject(new Error('No RapidAPI key configured'));
    }

    const options = {
      hostname: 'api-football-v1.p.rapidapi.com',
      path: '/v3/fixtures?league=1&season=2026',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.response) {
            resolve(json.response
              .filter(f => f.fixture.status.short === 'FT')
              .map(f => ({
                homeTeam: normalizeTeamName(f.teams.home.name),
                awayTeam: normalizeTeamName(f.teams.away.name),
                homeScore: f.goals.home,
                awayScore: f.goals.away,
                date: f.fixture.date.split('T')[0],
                status: 'finished'
              }))
            );
          } else {
            reject(new Error('Invalid API response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ======= Score Calculation (same logic as admin route) =======
function calculatePointsForMatch(matchId, scoreHome, scoreAway) {
  // Determine actual result
  let actual_result;
  if (scoreHome > scoreAway) {
    actual_result = 'home';
  } else if (scoreHome < scoreAway) {
    actual_result = 'away';
  } else {
    actual_result = 'draw';
  }

  // Update match
  prepareRun("UPDATE matches SET score_home = ?, score_away = ?, status = 'finished' WHERE id = ?",
    [scoreHome, scoreAway, matchId]);

  // Get all predictions for this match
  const predictions = prepareAll('SELECT * FROM predictions WHERE match_id = ?', [matchId]);

  // Reset previous points (in case of correction)
  for (const pred of predictions) {
    if (pred.points_earned > 0) {
      const correctResult = pred.points_earned >= 3 ? 1 : 0;
      const correctScore = pred.points_earned >= 8 ? 1 : 0;
      prepareRun(
        'UPDATE leaderboard SET total_points = total_points - ?, correct_results = correct_results - ?, correct_scores = correct_scores - ?, total_predictions = total_predictions - 1 WHERE user_id = ?',
        [pred.points_earned, correctResult, correctScore, pred.user_id]
      );
    }
  }

  // Calculate new points
  let updated = 0;
  for (const pred of predictions) {
    let points = 0;
    let correctResult = 0;
    let correctScore = 0;

    if (pred.predicted_result === actual_result) {
      points += POINTS.CORRECT_RESULT;
      correctResult = 1;
    }

    if (pred.predicted_home === scoreHome && pred.predicted_away === scoreAway) {
      points += POINTS.CORRECT_SCORE;
      correctScore = 1;
    }

    prepareRun('UPDATE predictions SET points_earned = ? WHERE id = ?', [points, pred.id]);

    const existingEntry = prepareGet('SELECT * FROM leaderboard WHERE user_id = ?', [pred.user_id]);
    if (existingEntry) {
      prepareRun(
        'UPDATE leaderboard SET total_points = total_points + ?, correct_results = correct_results + ?, correct_scores = correct_scores + ?, total_predictions = total_predictions + 1 WHERE user_id = ?',
        [points, correctResult, correctScore, pred.user_id]
      );
    } else {
      prepareRun(
        'INSERT INTO leaderboard (user_id, total_points, correct_results, correct_scores, total_predictions) VALUES (?, ?, ?, ?, 1)',
        [pred.user_id, points, correctResult, correctScore]
      );
    }
    updated++;
  }

  saveDb();
  return updated;
}

// ======= Main Update Function =======
async function checkAndUpdateResults() {
  const timestamp = new Date().toLocaleString('th-TH');
  console.log(`[${timestamp}] 🔄 ตรวจสอบผลการแข่งขัน...`);

  let results = [];

  // Try Football-Data.org first
  try {
    results = await fetchFromFootballData();
    console.log(`  📡 Football-Data.org: ได้ ${results.length} ผลการแข่งขัน`);
  } catch (e) {
    // Try API-Football as fallback
    try {
      results = await fetchFromApiFootball();
      console.log(`  📡 API-Football: ได้ ${results.length} ผลการแข่งขัน`);
    } catch (e2) {
      console.log(`  ⚠️  ไม่สามารถดึงข้อมูลได้ (ตั้งค่า API key ใน environment variable)`);
      console.log(`     - FOOTBALL_API_KEY (football-data.org)`);
      console.log(`     - RAPIDAPI_KEY (api-football via RapidAPI)`);
      return;
    }
  }

  if (results.length === 0) {
    console.log('  ℹ️  ไม่มีผลการแข่งขันใหม่');
    return;
  }

  // Match results with our database
  let updatedCount = 0;
  for (const result of results) {
    // Find matching match in our DB that hasn't been scored yet
    const match = prepareGet(
      "SELECT * FROM matches WHERE team_home = ? AND team_away = ? AND status != 'finished'",
      [result.homeTeam, result.awayTeam]
    );

    if (match && result.homeScore !== null && result.awayScore !== null) {
      const predictionsUpdated = calculatePointsForMatch(match.id, result.homeScore, result.awayScore);
      console.log(`  ✅ ${result.homeTeam} ${result.homeScore}-${result.awayScore} ${result.awayTeam} (คำนวณคะแนน ${predictionsUpdated} คน)`);
      updatedCount++;
    }
  }

  if (updatedCount === 0) {
    console.log('  ℹ️  ไม่มีแมตช์ใหม่ที่ต้องอัพเดท');
  } else {
    console.log(`  🏁 อัพเดทแล้ว ${updatedCount} แมตช์`);
  }
}

// ======= Set Live Status =======
async function checkAndSetLiveStatus() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getUTCHours().toString().padStart(2, '0');
  const currentMin = now.getUTCMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMin}`;

  // Find matches that should be live (started within last 2 hours)
  const upcomingToday = prepareAll(
    "SELECT * FROM matches WHERE match_date = ? AND status = 'upcoming'",
    [today]
  );

  for (const match of upcomingToday) {
    // Simple check: if match time has passed, set to live
    if (match.match_time <= currentTime) {
      prepareRun("UPDATE matches SET status = 'live' WHERE id = ?", [match.id]);
      console.log(`  🔴 LIVE: ${match.team_home} vs ${match.team_away}`);
    }
  }
}

// ======= Start Scheduler =======
let intervalId = null;

function startAutoUpdate() {
  console.log('⚡ Auto-Update Service เริ่มทำงาน');
  console.log(`   ตรวจสอบทุก ${CHECK_INTERVAL / 1000 / 60} นาที`);

  if (FOOTBALL_DATA_API_KEY || process.env.RAPIDAPI_KEY) {
    console.log('   ✅ API key configured');
  } else {
    console.log('   ⚠️  ไม่ได้ตั้งค่า API key - ใช้ Admin อัพเดทผลเอง');
    console.log('   💡 ตั้งค่า environment variable:');
    console.log('      FOOTBALL_API_KEY=your_key (football-data.org - ฟรี)');
    console.log('      RAPIDAPI_KEY=your_key (api-football via RapidAPI)');
  }

  // Run immediately once
  checkAndUpdateResults();

  // Schedule periodic checks
  intervalId = setInterval(async () => {
    await checkAndSetLiveStatus();
    await checkAndUpdateResults();
  }, CHECK_INTERVAL);
}

function stopAutoUpdate() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('⏹️  Auto-Update Service หยุดทำงาน');
  }
}

module.exports = { startAutoUpdate, stopAutoUpdate, checkAndUpdateResults };
