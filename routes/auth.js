const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepareGet, prepareRun } = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    const existingUser = prepareGet('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ error: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้ว' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = prepareRun('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

    // Create leaderboard entry
    prepareRun('INSERT OR IGNORE INTO leaderboard (user_id, total_points) VALUES (?, 0)', [result.lastInsertRowid]);

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, is_admin: 0 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: result.lastInsertRowid, username, is_admin: 0 } });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  try {
    const user = prepareGet('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!user) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin } });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = prepareGet('SELECT id, username, email, is_admin FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

module.exports = router;
