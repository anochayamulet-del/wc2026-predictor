const express = require('express');
const { prepareGet, prepareAll, prepareRun, saveDb } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * ============================================
 * 🏆 กติกาทายทีมแชมป์ฟุตบอลโลก 2026
 * ============================================
 * 
 * สมาชิกสามารถทายทีมแชมป์ได้ทุกรอบ จนกว่าจะถึงรอบชิงชนะเลิศ
 * โดยยิ่งทายเร็ว (รอบแรกๆ) จะได้คะแนนมากกว่า
 * 
 * ระบบคะแนน:
 * ┌─────────────────────┬──────────────┬─────────────────────────────────┐
 * │ รอบที่ทาย           │ คะแนนได้     │ เงื่อนไข                        │
 * ├─────────────────────┼──────────────┼─────────────────────────────────┤
 * │ รอบแบ่งกลุ่ม       │ 50 คะแนน    │ ทายก่อนรอบ 32 ทีมเริ่ม         │
 * │ รอบ 32 ทีม         │ 40 คะแนน    │ ทายก่อนรอบ 16 ทีมเริ่ม         │
 * │ รอบ 16 ทีม         │ 30 คะแนน    │ ทายก่อนรอบ 8 ทีมเริ่ม          │
 * │ รอบ 8 ทีม (QF)     │ 20 คะแนน    │ ทายก่อนรอบรองชนะเลิศเริ่ม      │
 * │ รอบรองชนะเลิศ (SF) │ 10 คะแนน    │ ทายก่อนรอบชิงชนะเลิศเริ่ม      │
 * │ รอบชิงชนะเลิศ      │ ❌ ปิดรับ    │ ไม่สามารถทายได้แล้ว             │
 * └─────────────────────┴──────────────┴─────────────────────────────────┘
 * 
 * กติกาเพิ่มเติม:
 * - ทายได้ 1 ทีมต่อรอบ (เปลี่ยนใจได้ภายในรอบเดิม)
 * - ถ้าทายถูกหลายรอบ จะได้คะแนนสูงสุดเพียงรอบเดียว (รอบที่ทายเร็วที่สุด)
 * - Admin เป็นคนกำหนดว่าตอนนี้อยู่รอบไหน และทีมแชมป์คือใคร
 * - เมื่อ Admin ประกาศทีมแชมป์ ระบบจะคำนวณคะแนนให้อัตโนมัติ
 */

// คะแนนแต่ละรอบ
const ROUND_POINTS = {
  'group': 50,       // ทายตั้งแต่รอบกลุ่ม
  'round32': 40,     // ทายตอนรอบ 32 ทีม
  'round16': 30,     // ทายตอนรอบ 16 ทีม
  'quarter': 20,     // ทายตอนรอบ 8 ทีม
  'semi': 10,        // ทายตอนรอบรองฯ
  'final': 0,        // ปิดรับแล้ว
};

const ROUND_NAMES = {
  'group': 'รอบแบ่งกลุ่ม',
  'round32': 'รอบ 32 ทีม',
  'round16': 'รอบ 16 ทีม',
  'quarter': 'รอบ 8 ทีม (Quarter-Final)',
  'semi': 'รอบรองชนะเลิศ (Semi-Final)',
  'final': 'รอบชิงชนะเลิศ (Final)',
};

// 48 ทีมที่เข้าร่วม
const ALL_TEAMS = [
  'Mexico', 'South Africa', 'South Korea', 'Czechia',
  'Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland',
  'Brazil', 'Morocco', 'Haiti', 'Scotland',
  'USA', 'Paraguay', 'Australia', 'Türkiye',
  'Germany', 'Curaçao', 'Ivory Coast', 'Ecuador',
  'Netherlands', 'Japan', 'Sweden', 'Tunisia',
  'Belgium', 'Egypt', 'Iran', 'New Zealand',
  'Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay',
  'France', 'Senegal', 'Iraq', 'Norway',
  'Argentina', 'Algeria', 'Austria', 'Jordan',
  'Portugal', 'DR Congo', 'Uzbekistan', 'Colombia',
  'England', 'Croatia', 'Ghana', 'Panama',
];

// ======= API Endpoints =======

// Get champion prediction settings & status
router.get('/status', (req, res) => {
  const settings = prepareGet('SELECT * FROM champion_settings WHERE id = 1');
  const roundStarted = settings?.round_started || 0;
  res.json({
    current_round: settings?.current_round || 'group',
    round_name: ROUND_NAMES[settings?.current_round || 'group'],
    champion_team: settings?.champion_team || null,
    is_locked: settings?.is_locked || 0,
    round_started: roundStarted,
    points_available: ROUND_POINTS[settings?.current_round || 'group'],
    teams: ALL_TEAMS,
    round_points: ROUND_POINTS,
    round_names: ROUND_NAMES,
  });
});

// Submit champion prediction
router.post('/predict', authenticateToken, (req, res) => {
  const { team } = req.body;
  const userId = req.user.id;

  if (!team) {
    return res.status(400).json({ error: 'กรุณาเลือกทีม' });
  }

  if (!ALL_TEAMS.includes(team)) {
    return res.status(400).json({ error: 'ทีมไม่ถูกต้อง' });
  }

  // Check settings
  const settings = prepareGet('SELECT * FROM champion_settings WHERE id = 1');
  if (!settings || settings.is_locked || settings.current_round === 'final') {
    return res.status(400).json({ error: 'ปิดรับทายผลแชมป์แล้ว (ถึงรอบชิงชนะเลิศ)' });
  }

  // Check if round has already started (first match kicked off)
  if (settings.round_started) {
    return res.status(400).json({ error: `ไม่สามารถทาย/เปลี่ยนได้แล้ว - ${ROUND_NAMES[settings.current_round]}เริ่มแข่งคู่แรกไปแล้ว` });
  }

  const currentRound = settings.current_round;

  try {
    // Check if already predicted this round
    const existing = prepareGet(
      'SELECT id FROM champion_predictions WHERE user_id = ? AND round = ?',
      [userId, currentRound]
    );

    if (existing) {
      // Update existing prediction for this round
      prepareRun(
        'UPDATE champion_predictions SET team = ?, created_at = datetime(\'now\') WHERE user_id = ? AND round = ?',
        [team, userId, currentRound]
      );
    } else {
      // New prediction
      prepareRun(
        'INSERT INTO champion_predictions (user_id, team, round) VALUES (?, ?, ?)',
        [userId, team, currentRound]
      );
    }

    res.json({
      message: `ทายทีมแชมป์: ${team} (${ROUND_NAMES[currentRound]}) สำเร็จ!`,
      team,
      round: currentRound,
      potential_points: ROUND_POINTS[currentRound],
    });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});

// Get my champion predictions
router.get('/my', authenticateToken, (req, res) => {
  const predictions = prepareAll(
    'SELECT * FROM champion_predictions WHERE user_id = ? ORDER BY created_at ASC',
    [req.user.id]
  );

  const settings = prepareGet('SELECT * FROM champion_settings WHERE id = 1');

  res.json({
    predictions: predictions.map(p => ({
      ...p,
      round_name: ROUND_NAMES[p.round],
      potential_points: ROUND_POINTS[p.round],
    })),
    current_round: settings?.current_round || 'group',
    champion_team: settings?.champion_team || null,
  });
});

// Get all champion predictions (public stats)
router.get('/stats', (req, res) => {
  // Count predictions per team
  const stats = prepareAll(`
    SELECT team, COUNT(*) as count 
    FROM champion_predictions 
    GROUP BY team 
    ORDER BY count DESC
  `);

  const totalPredictions = prepareGet('SELECT COUNT(DISTINCT user_id) as total FROM champion_predictions');

  res.json({
    stats,
    total_participants: totalPredictions?.total || 0,
  });
});

// ======= Admin Endpoints =======

// Set current round
router.put('/admin/round', authenticateToken, requireAdmin, (req, res) => {
  const { round } = req.body;

  if (!ROUND_POINTS.hasOwnProperty(round)) {
    return res.status(400).json({ error: 'รอบไม่ถูกต้อง' });
  }

  // Reset round_started when entering a new round (users can predict until first match)
  prepareRun('UPDATE champion_settings SET current_round = ?, round_started = 0 WHERE id = 1', [round]);

  // If final, lock predictions
  if (round === 'final') {
    prepareRun('UPDATE champion_settings SET is_locked = 1, round_started = 1 WHERE id = 1');
  }

  res.json({ message: `เปลี่ยนรอบเป็น ${ROUND_NAMES[round]} สำเร็จ (เปิดรับทายผลจนกว่าคู่แรกจะเริ่ม)` });
});

// Lock current round (first match started)
router.put('/admin/lock-round', authenticateToken, requireAdmin, (req, res) => {
  prepareRun('UPDATE champion_settings SET round_started = 1 WHERE id = 1');
  const settings = prepareGet('SELECT * FROM champion_settings WHERE id = 1');
  res.json({ message: `ล็อค${ROUND_NAMES[settings.current_round]}แล้ว - ไม่สามารถทาย/เปลี่ยนได้อีก` });
});

// Set champion and calculate points
router.put('/admin/champion', authenticateToken, requireAdmin, (req, res) => {
  const { team } = req.body;

  if (!team || !ALL_TEAMS.includes(team)) {
    return res.status(400).json({ error: 'ทีมไม่ถูกต้อง' });
  }

  // Lock and set champion
  prepareRun('UPDATE champion_settings SET champion_team = ?, is_locked = 1, current_round = ? WHERE id = 1', [team, 'final']);

  // Reset previous champion points
  prepareRun('UPDATE champion_predictions SET points_earned = 0');

  // Calculate points - each user gets points from their EARLIEST correct prediction
  const correctPredictions = prepareAll(
    'SELECT * FROM champion_predictions WHERE team = ? ORDER BY user_id, created_at ASC',
    [team]
  );

  // Group by user and take earliest prediction
  const userEarliestPred = {};
  for (const pred of correctPredictions) {
    if (!userEarliestPred[pred.user_id]) {
      userEarliestPred[pred.user_id] = pred;
    }
  }

  let winnersCount = 0;
  for (const userId in userEarliestPred) {
    const pred = userEarliestPred[userId];
    const points = ROUND_POINTS[pred.round] || 0;

    if (points > 0) {
      prepareRun('UPDATE champion_predictions SET points_earned = ? WHERE id = ?', [points, pred.id]);

      // Add to leaderboard
      const existingEntry = prepareGet('SELECT * FROM leaderboard WHERE user_id = ?', [parseInt(userId)]);
      if (existingEntry) {
        prepareRun('UPDATE leaderboard SET total_points = total_points + ? WHERE user_id = ?', [points, parseInt(userId)]);
      } else {
        prepareRun('INSERT INTO leaderboard (user_id, total_points, correct_results, correct_scores, total_predictions) VALUES (?, ?, 0, 0, 0)', [parseInt(userId), points]);
      }
      winnersCount++;
    }
  }

  saveDb();

  res.json({
    message: `🏆 ประกาศแชมป์: ${team}! คำนวณคะแนนให้ ${winnersCount} คนที่ทายถูก`,
    champion: team,
    winners: winnersCount,
  });
});

module.exports = router;
