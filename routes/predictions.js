const express = require('express');
const { prepareGet, prepareAll, prepareRun } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Submit prediction
router.post('/', authenticateToken, (req, res) => {
  const { match_id, predicted_home, predicted_away } = req.body;
  const user_id = req.user.id;

  if (predicted_home === undefined || predicted_away === undefined || !match_id) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  if (predicted_home < 0 || predicted_away < 0) {
    return res.status(400).json({ error: 'สกอร์ต้องไม่ติดลบ' });
  }

  // Check if match exists and is upcoming
  const match = prepareGet('SELECT * FROM matches WHERE id = ?', [match_id]);
  if (!match) {
    return res.status(404).json({ error: 'ไม่พบการแข่งขัน' });
  }
  if (match.status !== 'upcoming') {
    return res.status(400).json({ error: 'ไม่สามารถทายผลได้ การแข่งขันเริ่มแล้วหรือจบแล้ว' });
  }

  // Determine predicted result
  let predicted_result;
  if (predicted_home > predicted_away) {
    predicted_result = 'home';
  } else if (predicted_home < predicted_away) {
    predicted_result = 'away';
  } else {
    predicted_result = 'draw';
  }

  try {
    const existing = prepareGet('SELECT id FROM predictions WHERE user_id = ? AND match_id = ?', [user_id, match_id]);

    if (existing) {
      prepareRun(
        'UPDATE predictions SET predicted_home = ?, predicted_away = ?, predicted_result = ? WHERE user_id = ? AND match_id = ?',
        [predicted_home, predicted_away, predicted_result, user_id, match_id]
      );
    } else {
      prepareRun(
        'INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, predicted_result) VALUES (?, ?, ?, ?, ?)',
        [user_id, match_id, predicted_home, predicted_away, predicted_result]
      );
    }

    res.json({ message: 'บันทึกการทายผลสำเร็จ', predicted_result });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});

// Get user predictions
router.get('/my', authenticateToken, (req, res) => {
  const predictions = prepareAll(`
    SELECT p.*, m.team_home, m.team_away, m.match_date, m.match_time, 
           m.score_home, m.score_away, m.status, m.group_name
    FROM predictions p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = ?
    ORDER BY m.match_date ASC, m.match_time ASC
  `, [req.user.id]);

  res.json(predictions);
});

// Get predictions for a specific match
router.get('/match/:matchId', authenticateToken, (req, res) => {
  const prediction = prepareGet(
    'SELECT * FROM predictions WHERE user_id = ? AND match_id = ?',
    [req.user.id, parseInt(req.params.matchId)]
  );

  res.json(prediction || null);
});

module.exports = router;
