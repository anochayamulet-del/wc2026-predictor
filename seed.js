const { getDb, prepareGet, prepareRun, prepareAll, saveDb } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  await getDb();

  // Create admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const existingAdmin = prepareGet('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!existingAdmin) {
    const result = prepareRun('INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)', ['admin', 'admin@wc2026.com', adminPassword, 1]);
    prepareRun('INSERT INTO leaderboard (user_id, total_points) VALUES (?, 0)', [result.lastInsertRowid]);
    console.log('✅ Admin user created: admin / admin123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // World Cup 2026 Group Stage Matches
  const matches = [
    // June 11
    { group: 'A', home: 'Mexico', away: 'South Africa', date: '2026-06-11', time: '15:00', venue: 'Estadio Azteca, Mexico City' },
    { group: 'A', home: 'South Korea', away: 'Czechia', date: '2026-06-11', time: '22:00', venue: 'Estadio Akron, Zapopan' },

    // June 12
    { group: 'B', home: 'Canada', away: 'Bosnia & Herzegovina', date: '2026-06-12', time: '15:00', venue: 'BMO Field, Toronto' },
    { group: 'D', home: 'USA', away: 'Paraguay', date: '2026-06-12', time: '21:00', venue: 'SoFi Stadium, Inglewood' },

    // June 13
    { group: 'B', home: 'Qatar', away: 'Switzerland', date: '2026-06-13', time: '15:00', venue: "Levi's Stadium, Santa Clara" },
    { group: 'C', home: 'Brazil', away: 'Morocco', date: '2026-06-13', time: '18:00', venue: 'MetLife Stadium, East Rutherford' },
    { group: 'C', home: 'Haiti', away: 'Scotland', date: '2026-06-13', time: '21:00', venue: 'Gillette Stadium, Foxborough' },

    // June 14
    { group: 'D', home: 'Australia', away: 'Türkiye', date: '2026-06-14', time: '00:00', venue: 'BC Place, Vancouver' },
    { group: 'E', home: 'Germany', away: 'Curaçao', date: '2026-06-14', time: '13:00', venue: 'NRG Stadium, Houston' },
    { group: 'F', home: 'Netherlands', away: 'Japan', date: '2026-06-14', time: '16:00', venue: 'AT&T Stadium, Arlington' },
    { group: 'E', home: 'Ivory Coast', away: 'Ecuador', date: '2026-06-14', time: '19:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { group: 'F', home: 'Sweden', away: 'Tunisia', date: '2026-06-14', time: '22:00', venue: 'Estadio BBVA, Monterrey' },

    // June 15
    { group: 'H', home: 'Spain', away: 'Cape Verde', date: '2026-06-15', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { group: 'G', home: 'Belgium', away: 'Egypt', date: '2026-06-15', time: '15:00', venue: 'Lumen Field, Seattle' },
    { group: 'H', home: 'Saudi Arabia', away: 'Uruguay', date: '2026-06-15', time: '18:00', venue: 'Hard Rock Stadium, Miami Gardens' },
    { group: 'G', home: 'Iran', away: 'New Zealand', date: '2026-06-15', time: '21:00', venue: 'SoFi Stadium, Inglewood' },

    // June 16
    { group: 'I', home: 'France', away: 'Senegal', date: '2026-06-16', time: '15:00', venue: 'MetLife Stadium, East Rutherford' },
    { group: 'I', home: 'Iraq', away: 'Norway', date: '2026-06-16', time: '18:00', venue: 'Gillette Stadium, Foxborough' },
    { group: 'J', home: 'Argentina', away: 'Algeria', date: '2026-06-16', time: '21:00', venue: 'Arrowhead Stadium, Kansas City' },

    // June 17
    { group: 'J', home: 'Austria', away: 'Jordan', date: '2026-06-17', time: '00:00', venue: "Levi's Stadium, Santa Clara" },
    { group: 'K', home: 'Portugal', away: 'DR Congo', date: '2026-06-17', time: '13:00', venue: 'NRG Stadium, Houston' },
    { group: 'L', home: 'England', away: 'Croatia', date: '2026-06-17', time: '16:00', venue: 'AT&T Stadium, Arlington' },
    { group: 'L', home: 'Ghana', away: 'Panama', date: '2026-06-17', time: '19:00', venue: 'BMO Field, Toronto' },
    { group: 'K', home: 'Uzbekistan', away: 'Colombia', date: '2026-06-17', time: '22:00', venue: 'Estadio Azteca, Mexico City' },

    // June 18 - Matchday 2
    { group: 'A', home: 'Czechia', away: 'South Africa', date: '2026-06-18', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { group: 'B', home: 'Switzerland', away: 'Bosnia & Herzegovina', date: '2026-06-18', time: '15:00', venue: 'SoFi Stadium, Inglewood' },
    { group: 'B', home: 'Canada', away: 'Qatar', date: '2026-06-18', time: '18:00', venue: 'BC Place, Vancouver' },
    { group: 'A', home: 'Mexico', away: 'South Korea', date: '2026-06-18', time: '21:00', venue: 'Estadio Akron, Zapopan' },

    // June 19
    { group: 'D', home: 'USA', away: 'Australia', date: '2026-06-19', time: '15:00', venue: 'Lumen Field, Seattle' },
    { group: 'C', home: 'Scotland', away: 'Morocco', date: '2026-06-19', time: '18:00', venue: 'Gillette Stadium, Foxborough' },
    { group: 'C', home: 'Brazil', away: 'Haiti', date: '2026-06-19', time: '20:30', venue: 'Lincoln Financial Field, Philadelphia' },
    { group: 'D', home: 'Türkiye', away: 'Paraguay', date: '2026-06-19', time: '23:00', venue: "Levi's Stadium, Santa Clara" },

    // June 20
    { group: 'F', home: 'Netherlands', away: 'Sweden', date: '2026-06-20', time: '13:00', venue: 'NRG Stadium, Houston' },
    { group: 'E', home: 'Germany', away: 'Ivory Coast', date: '2026-06-20', time: '16:00', venue: 'BMO Field, Toronto' },
    { group: 'E', home: 'Ecuador', away: 'Curaçao', date: '2026-06-20', time: '20:00', venue: 'Arrowhead Stadium, Kansas City' },

    // June 21
    { group: 'F', home: 'Tunisia', away: 'Japan', date: '2026-06-21', time: '00:00', venue: 'Estadio BBVA, Monterrey' },
    { group: 'H', home: 'Spain', away: 'Saudi Arabia', date: '2026-06-21', time: '12:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { group: 'G', home: 'Belgium', away: 'Iran', date: '2026-06-21', time: '15:00', venue: 'SoFi Stadium, Inglewood' },
    { group: 'H', home: 'Uruguay', away: 'Cape Verde', date: '2026-06-21', time: '18:00', venue: 'Hard Rock Stadium, Miami Gardens' },
    { group: 'G', home: 'New Zealand', away: 'Egypt', date: '2026-06-21', time: '21:00', venue: 'BC Place, Vancouver' },

    // June 22
    { group: 'J', home: 'Argentina', away: 'Austria', date: '2026-06-22', time: '13:00', venue: 'AT&T Stadium, Arlington' },
    { group: 'I', home: 'France', away: 'Iraq', date: '2026-06-22', time: '17:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { group: 'I', home: 'Norway', away: 'Senegal', date: '2026-06-22', time: '20:00', venue: 'MetLife Stadium, East Rutherford' },
    { group: 'J', home: 'Jordan', away: 'Algeria', date: '2026-06-22', time: '23:00', venue: "Levi's Stadium, Santa Clara" },

    // June 23
    { group: 'K', home: 'Portugal', away: 'Uzbekistan', date: '2026-06-23', time: '13:00', venue: 'NRG Stadium, Houston' },
    { group: 'L', home: 'England', away: 'Ghana', date: '2026-06-23', time: '16:00', venue: 'Gillette Stadium, Foxborough' },
    { group: 'L', home: 'Panama', away: 'Croatia', date: '2026-06-23', time: '19:00', venue: 'BMO Field, Toronto' },
    { group: 'K', home: 'Colombia', away: 'DR Congo', date: '2026-06-23', time: '22:00', venue: 'Estadio Akron, Zapopan' },

    // June 24 - Final Matchday
    { group: 'B', home: 'Switzerland', away: 'Canada', date: '2026-06-24', time: '15:00', venue: 'BC Place, Vancouver' },
    { group: 'B', home: 'Bosnia & Herzegovina', away: 'Qatar', date: '2026-06-24', time: '15:00', venue: 'Lumen Field, Seattle' },
    { group: 'C', home: 'Scotland', away: 'Brazil', date: '2026-06-24', time: '18:00', venue: 'Hard Rock Stadium, Miami Gardens' },
    { group: 'C', home: 'Morocco', away: 'Haiti', date: '2026-06-24', time: '18:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { group: 'A', home: 'Czechia', away: 'Mexico', date: '2026-06-24', time: '21:00', venue: 'Estadio Azteca, Mexico City' },
    { group: 'A', home: 'South Africa', away: 'South Korea', date: '2026-06-24', time: '21:00', venue: 'Estadio BBVA, Monterrey' },

    // June 25
    { group: 'E', home: 'Curaçao', away: 'Ivory Coast', date: '2026-06-25', time: '16:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { group: 'E', home: 'Ecuador', away: 'Germany', date: '2026-06-25', time: '16:00', venue: 'MetLife Stadium, East Rutherford' },
    { group: 'F', home: 'Japan', away: 'Sweden', date: '2026-06-25', time: '19:00', venue: 'AT&T Stadium, Arlington' },
    { group: 'F', home: 'Tunisia', away: 'Netherlands', date: '2026-06-25', time: '19:00', venue: 'Arrowhead Stadium, Kansas City' },
    { group: 'D', home: 'Türkiye', away: 'USA', date: '2026-06-25', time: '22:00', venue: 'SoFi Stadium, Inglewood' },
    { group: 'D', home: 'Paraguay', away: 'Australia', date: '2026-06-25', time: '22:00', venue: "Levi's Stadium, Santa Clara" },

    // June 26
    { group: 'I', home: 'Norway', away: 'France', date: '2026-06-26', time: '15:00', venue: 'Gillette Stadium, Foxborough' },
    { group: 'I', home: 'Senegal', away: 'Iraq', date: '2026-06-26', time: '15:00', venue: 'BMO Field, Toronto' },
    { group: 'H', home: 'Cape Verde', away: 'Saudi Arabia', date: '2026-06-26', time: '20:00', venue: 'NRG Stadium, Houston' },
    { group: 'H', home: 'Uruguay', away: 'Spain', date: '2026-06-26', time: '20:00', venue: 'Estadio Akron, Zapopan' },
    { group: 'G', home: 'Egypt', away: 'Iran', date: '2026-06-26', time: '23:00', venue: 'Lumen Field, Seattle' },
    { group: 'G', home: 'New Zealand', away: 'Belgium', date: '2026-06-26', time: '23:00', venue: 'BC Place, Vancouver' },

    // June 27
    { group: 'L', home: 'Panama', away: 'England', date: '2026-06-27', time: '17:00', venue: 'MetLife Stadium, East Rutherford' },
    { group: 'L', home: 'Croatia', away: 'Ghana', date: '2026-06-27', time: '17:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { group: 'K', home: 'Colombia', away: 'Portugal', date: '2026-06-27', time: '19:30', venue: 'Hard Rock Stadium, Miami Gardens' },
    { group: 'K', home: 'DR Congo', away: 'Uzbekistan', date: '2026-06-27', time: '19:30', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { group: 'J', home: 'Algeria', away: 'Austria', date: '2026-06-27', time: '22:00', venue: 'Arrowhead Stadium, Kansas City' },
    { group: 'J', home: 'Jordan', away: 'Argentina', date: '2026-06-27', time: '22:00', venue: 'AT&T Stadium, Arlington' },
  ];

  // Check if matches already seeded
  const existingMatches = prepareAll('SELECT id FROM matches LIMIT 1');
  if (existingMatches.length > 0) {
    console.log('ℹ️  Matches already seeded. Skipping...');
  } else {
    for (const match of matches) {
      prepareRun(
        'INSERT INTO matches (group_name, team_home, team_away, match_date, match_time, venue) VALUES (?, ?, ?, ?, ?, ?)',
        [match.group, match.home, match.away, match.date, match.time, match.venue]
      );
    }
    console.log(`✅ Seeded ${matches.length} matches for World Cup 2026 group stage.`);
  }

  saveDb();
  console.log('🏁 Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
