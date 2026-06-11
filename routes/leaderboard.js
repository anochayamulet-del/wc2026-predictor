const express = require('express');
const { prepareAll, prepareGet } = require('../db');

const router = express.Router();

// Get leaderboard
router.get('/', (req, res) => {
  const leaderboard = prepareAll(`
    SELECT l.*, u.username
    FROM leaderboard l
    JOIN users u ON l.user_id = u.id
    WHERE l.total_predictions > 0
    ORDER BY l.total_points DESC, l.correct_scores DESC, l.correct_results DESC
    LIMIT 100
  `);

  res.json(leaderboard);
});

// Get all members (including those with 0 points)
router.get('/all', (req, res) => {
  const members = prepareAll(`
    SELECT u.id, u.username, 
           COALESCE(l.total_points, 0) as total_points,
           COALESCE(l.correct_results, 0) as correct_results,
           COALESCE(l.correct_scores, 0) as correct_scores,
           COALESCE(l.total_predictions, 0) as total_predictions
    FROM users u
    LEFT JOIN leaderboard l ON u.id = l.user_id
    WHERE u.is_admin = 0
    ORDER BY l.total_points DESC, u.username ASC
    LIMIT 100
  `);

  // Get champion predictions for each member
  for (const member of members) {
    const champPreds = prepareAll(
      "SELECT team, round FROM champion_predictions WHERE user_id = ? ORDER BY created_at ASC",
      [member.id]
    );
    member.champion_picks = champPreds;
  }

  res.json(members);
});

// Get user stats
router.get('/user/:userId', (req, res) => {
  const stats = prepareGet(`
    SELECT l.*, u.username
    FROM leaderboard l
    JOIN users u ON l.user_id = u.id
    WHERE l.user_id = ?
  `, [parseInt(req.params.userId)]);

  if (!stats) {
    return res.status(404).json({ error: 'ไม่พบข้อมูล' });
  }

  res.json(stats);
});

module.exports = router;
