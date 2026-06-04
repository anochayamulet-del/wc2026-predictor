require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB then start server
async function start() {
  await getDb();

  // Routes (loaded after DB is ready)
  const authRoutes = require('./routes/auth');
  const matchRoutes = require('./routes/matches');
  const predictionRoutes = require('./routes/predictions');
  const adminRoutes = require('./routes/admin');
  const leaderboardRoutes = require('./routes/leaderboard');
  const championRoutes = require('./routes/champion');
  const { startAutoUpdate } = require('./services/auto-update');

  app.use('/api/auth', authRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/predictions', predictionRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/champion', championRoutes);

  // Serve frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`⚽ WC2026 Prediction server running on http://localhost:${PORT}`);
    console.log('');

    // Start auto-update service
    startAutoUpdate();
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
