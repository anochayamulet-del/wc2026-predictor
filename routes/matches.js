const express = require('express');
const { prepareAll, prepareGet } = require('../db');

const router = express.Router();

// Get all matches
router.get('/', (req, res) => {
  const { group, status } = req.query;
  let query = 'SELECT * FROM matches';
  const conditions = [];
  const params = [];

  if (group) {
    conditions.push('group_name = ?');
    params.push(group);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY match_date ASC, match_time ASC';

  const matches = prepareAll(query, params);
  res.json(matches);
});

// Get single match
router.get('/:id', (req, res) => {
  const match = prepareGet('SELECT * FROM matches WHERE id = ?', [parseInt(req.params.id)]);
  if (!match) {
    return res.status(404).json({ error: 'ไม่พบการแข่งขัน' });
  }
  res.json(match);
});

// Get group standings
router.get('/standings/:group', (req, res) => {
  const group = req.params.group.toUpperCase();
  const matches = prepareAll(
    "SELECT * FROM matches WHERE group_name = ? AND status = 'finished'",
    [group]
  );

  // Get all teams in this group
  const allGroupMatches = prepareAll('SELECT * FROM matches WHERE group_name = ?', [group]);
  const teamsSet = new Set();
  allGroupMatches.forEach(m => { teamsSet.add(m.team_home); teamsSet.add(m.team_away); });

  // Calculate standings
  const standings = {};
  teamsSet.forEach(team => {
    standings[team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
  });

  for (const m of matches) {
    const home = standings[m.team_home];
    const away = standings[m.team_away];
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.gf += m.score_home;
    home.ga += m.score_away;
    away.gf += m.score_away;
    away.ga += m.score_home;

    if (m.score_home > m.score_away) {
      home.won++; home.points += 3;
      away.lost++;
    } else if (m.score_home < m.score_away) {
      away.won++; away.points += 3;
      home.lost++;
    } else {
      home.drawn++; home.points += 1;
      away.drawn++; away.points += 1;
    }
  }

  // Calculate goal difference and sort
  const sorted = Object.values(standings).map(s => {
    s.gd = s.gf - s.ga;
    return s;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });

  res.json(sorted);
});

module.exports = router;
