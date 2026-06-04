const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'wc2026.db');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT NOT NULL,
      team_home TEXT NOT NULL,
      team_away TEXT NOT NULL,
      match_date TEXT NOT NULL,
      match_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      score_home INTEGER DEFAULT NULL,
      score_away INTEGER DEFAULT NULL,
      status TEXT DEFAULT 'upcoming',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      predicted_home INTEGER NOT NULL,
      predicted_away INTEGER NOT NULL,
      predicted_result TEXT NOT NULL,
      points_earned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (match_id) REFERENCES matches(id),
      UNIQUE(user_id, match_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      user_id INTEGER PRIMARY KEY,
      total_points INTEGER DEFAULT 0,
      correct_results INTEGER DEFAULT 0,
      correct_scores INTEGER DEFAULT 0,
      total_predictions INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS champion_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      team TEXT NOT NULL,
      round TEXT NOT NULL,
      points_earned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, round)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS champion_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      current_round TEXT DEFAULT 'group',
      champion_team TEXT DEFAULT NULL,
      is_locked INTEGER DEFAULT 0,
      round_started INTEGER DEFAULT 0
    )
  `);

  // Insert default settings if not exists
  const settings = db.exec("SELECT id FROM champion_settings LIMIT 1");
  if (!settings.length || !settings[0].values.length) {
    db.run("INSERT OR IGNORE INTO champion_settings (id, current_round, is_locked, round_started) VALUES (1, 'group', 0, 0)");
  }

  saveDb();
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper functions to mimic better-sqlite3 API
function prepareGet(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function prepareAll(sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function prepareRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0 };
}

module.exports = { getDb, saveDb, prepareGet, prepareAll, prepareRun };
