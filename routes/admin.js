const express = require('express');
const { prepareGet, prepareAll, prepareRun, saveDb } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkAndUpdateResults } = require('../services/auto-update');

const router = express.Router();

// Point system
const POINTS = {
  CORRECT_RESULT: 3,
  CORRECT_SCORE: 5,
};

// Update match result
router.put('/matches/:id/result', authenticateToken, requireAdmin, (req, res) => {
  const { score_home, score_away } = req.body;
  const matchId = parseInt(req.params.id);

  if (score_home === undefined || score_away === undefined) {
    return res.status(400).json({ error: 'กรุณากรอกสกอร์ให้ครบ' });
  }

  if (score_home < 0 || score_away < 0) {
    return res.status(400).json({ error: 'สกอร์ต้องไม่ติดลบ' });
  }

  const match = prepareGet('SELECT * FROM matches WHERE id = ?', [matchId]);
  if (!match) {
    return res.status(404).json({ error: 'ไม่พบการแข่งขัน' });
  }

  // Determine actual result
  let actual_result;
  if (score_home > score_away) {
    actual_result = 'home';
  } else if (score_home < score_away) {
    actual_result = 'away';
  } else {
    actual_result = 'draw';
  }

  // Update match
  prepareRun("UPDATE matches SET score_home = ?, score_away = ?, status = 'finished' WHERE id = ?", [score_home, score_away, matchId]);

  // Get all predictions for this match
  const predictions = prepareAll('SELECT * FROM predictions WHERE match_id = ?', [matchId]);

  // Reset previous points for this match (in case of result re-update)
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
  for (const pred of predictions) {
    let points = 0;
    let correctResult = 0;
    let correctScore = 0;

    // Check if result is correct
    if (pred.predicted_result === actual_result) {
      points += POINTS.CORRECT_RESULT;
      correctResult = 1;
    }

    // Check if exact score is correct
    if (pred.predicted_home === score_home && pred.predicted_away === score_away) {
      points += POINTS.CORRECT_SCORE;
      correctScore = 1;
    }

    prepareRun('UPDATE predictions SET points_earned = ? WHERE id = ?', [points, pred.id]);

    // Update leaderboard
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
  }

  saveDb();

  res.json({
    message: 'อัพเดทผลการแข่งขันสำเร็จ',
    match: { ...match, score_home, score_away, status: 'finished' },
    predictions_updated: predictions.length
  });
});

// Set match status
router.put('/matches/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  const matchId = parseInt(req.params.id);

  if (!['upcoming', 'live', 'finished'].includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
  }

  prepareRun('UPDATE matches SET status = ? WHERE id = ?', [status, matchId]);
  res.json({ message: 'อัพเดทสถานะสำเร็จ' });
});

// Get all users (admin)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const users = prepareAll('SELECT id, username, email, is_admin, created_at FROM users');
  res.json(users);
});

// Get match predictions summary (admin)
router.get('/matches/:id/predictions', authenticateToken, requireAdmin, (req, res) => {
  const predictions = prepareAll(`
    SELECT p.*, u.username
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.match_id = ?
    ORDER BY u.username
  `, [parseInt(req.params.id)]);

  res.json(predictions);
});

// Trigger manual auto-update
router.post('/auto-update', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await checkAndUpdateResults();
    res.json({ message: 'ตรวจสอบและอัพเดทผลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});

module.exports = router;
