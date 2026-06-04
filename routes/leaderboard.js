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
