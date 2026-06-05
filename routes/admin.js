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

// ======= User Management =======

// Get all users with their scores
router.get('/users/scores', authenticateToken, requireAdmin, (req, res) => {
  const users = prepareAll(`
    SELECT u.id, u.username, u.email, u.is_admin, u.created_at,
           COALESCE(l.total_points, 0) as total_points,
           COALESCE(l.correct_results, 0) as correct_results,
           COALESCE(l.correct_scores, 0) as correct_scores,
           COALESCE(l.total_predictions, 0) as total_predictions
    FROM users u
    LEFT JOIN leaderboard l ON u.id = l.user_id
    ORDER BY u.id
  `);
  res.json(users);
});

// Update user points
router.put('/users/:id/points', authenticateToken, requireAdmin, (req, res) => {
  const { total_points } = req.body;
  const userId = parseInt(req.params.id);

  if (total_points === undefined || total_points < 0) {
    return res.status(400).json({ error: 'คะแนนไม่ถูกต้อง' });
  }

  const user = prepareGet('SELECT id, username FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  }

  const existing = prepareGet('SELECT * FROM leaderboard WHERE user_id = ?', [userId]);
  if (existing) {
    prepareRun('UPDATE leaderboard SET total_points = ? WHERE user_id = ?', [total_points, userId]);
  } else {
    prepareRun('INSERT INTO leaderboard (user_id, total_points, correct_results, correct_scores, total_predictions) VALUES (?, ?, 0, 0, 0)', [userId, total_points]);
  }

  res.json({ message: `แก้ไขคะแนน ${user.username} เป็น ${total_points} สำเร็จ` });
});

// Reset points for single user
router.post('/users/:id/reset', authenticateToken, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  const user = prepareGet('SELECT id, username FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  }

  prepareRun('UPDATE leaderboard SET total_points = 0, correct_results = 0, correct_scores = 0, total_predictions = 0 WHERE user_id = ?', [userId]);
  prepareRun('UPDATE predictions SET points_earned = 0 WHERE user_id = ?', [userId]);
  prepareRun('UPDATE champion_predictions SET points_earned = 0 WHERE user_id = ?', [userId]);

  res.json({ message: `Reset คะแนน ${user.username} เป็น 0 สำเร็จ` });
});

// Bulk reset points for multiple users
router.post('/users/bulk-reset', authenticateToken, requireAdmin, (req, res) => {
  const { user_ids } = req.body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'กรุณาเลือกผู้ใช้' });
  }

  let count = 0;
  for (const userId of user_ids) {
    const user = prepareGet('SELECT id FROM users WHERE id = ?', [userId]);
    if (user) {
      prepareRun('UPDATE leaderboard SET total_points = 0, correct_results = 0, correct_scores = 0, total_predictions = 0 WHERE user_id = ?', [userId]);
      prepareRun('UPDATE predictions SET points_earned = 0 WHERE user_id = ?', [userId]);
      prepareRun('UPDATE champion_predictions SET points_earned = 0 WHERE user_id = ?', [userId]);
      count++;
    }
  }

  res.json({ message: `Reset คะแนนสำเร็จ ${count} คน` });
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  const user = prepareGet('SELECT id, username, is_admin FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  }
  if (user.is_admin) {
    return res.status(400).json({ error: 'ไม่สามารถลบ Admin ได้' });
  }

  prepareRun('DELETE FROM predictions WHERE user_id = ?', [userId]);
  prepareRun('DELETE FROM champion_predictions WHERE user_id = ?', [userId]);
  prepareRun('DELETE FROM leaderboard WHERE user_id = ?', [userId]);
  prepareRun('DELETE FROM users WHERE id = ?', [userId]);

  res.json({ message: `ลบผู้ใช้ ${user.username} สำเร็จ` });
});

module.exports = router;
