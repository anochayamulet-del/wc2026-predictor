// State
let currentUser = null;
let token = localStorage.getItem('wc2026_token');

// API Helper
async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
  return data;
}

// Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  } text-white`;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// All teams list for admin dropdown
const ALL_TEAMS_LIST = [
  'Mexico', 'South Africa', 'South Korea', 'Czechia',
  'Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland',
  'Brazil', 'Morocco', 'Haiti', 'Scotland',
  'USA', 'Paraguay', 'Australia', 'Türkiye',
  'Germany', 'Curaçao', 'Ivory Coast', 'Ecuador',
  'Netherlands', 'Japan', 'Sweden', 'Tunisia',
  'Belgium', 'Egypt', 'Iran', 'New Zealand',
  'Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay',
  'France', 'Senegal', 'Iraq', 'Norway',
  'Argentina', 'Algeria', 'Austria', 'Jordan',
  'Portugal', 'DR Congo', 'Uzbekistan', 'Colombia',
  'England', 'Croatia', 'Ghana', 'Panama',
];

// Country flag mapping - using ISO country codes for flag images
const countryFlagCodes = {
  'Mexico': 'mx', 'South Africa': 'za', 'South Korea': 'kr', 'Czechia': 'cz',
  'Canada': 'ca', 'Bosnia & Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', 'Ivory Coast': 'ci', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'Iran': 'ir', 'New Zealand': 'nz',
  'Spain': 'es', 'Cape Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'DR Congo': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa'
};

// Country flag emoji (fallback)
const countryFlags = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Bosnia & Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Türkiye': '🇹🇷',
  'Germany': '🇩🇪', 'Curaçao': '🇨🇼', 'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'Spain': '🇪🇸', 'Cape Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'DR Congo': '🇨🇩', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦'
};

function getFlagLarge(team) {
  const code = countryFlagCodes[team];
  if (code) {
    return `<img src="https://flagcdn.com/48x36/${code}.png" srcset="https://flagcdn.com/96x72/${code}.png 2x" width="48" height="36" alt="${team}" class="inline-block rounded shadow-sm">`;
  }
  return `<span class="text-3xl">${countryFlags[team] || '🏳️'}</span>`;
}

function getFlag(team) {
  const code = countryFlagCodes[team];
  if (code) {
    return `<img src="https://flagcdn.com/24x18/${code}.png" srcset="https://flagcdn.com/48x36/${code}.png 2x" width="24" height="18" alt="${team}" class="inline-block rounded-sm shadow-sm" style="vertical-align: middle;">`;
  }
  return countryFlags[team] || '🏳️';
}

// Format date in Thai
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Convert ET time to Thailand time (ET + 11 hours)
function toThaiTime(dateStr, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + (11 * 60); // +11 hours for Thailand
  
  let newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  let newDate = new Date(dateStr + 'T00:00:00');
  
  if (newHours >= 24) {
    newHours -= 24;
    newDate.setDate(newDate.getDate() + 1);
  }
  
  const thaiTimeStr = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  const thaiDateStr = newDate.toISOString().split('T')[0];
  
  return { time: thaiTimeStr, date: thaiDateStr };
}

// Format time display with Thai timezone
function formatMatchTime(dateStr, timeStr) {
  const thai = toThaiTime(dateStr, timeStr);
  return `${thai.time} น.`;
}

// Format date considering Thai timezone shift
function formatMatchDate(dateStr, timeStr) {
  const thai = toThaiTime(dateStr, timeStr);
  return formatDate(thai.date);
}

// Navigation
function renderNav() {
  const nav = document.getElementById('nav-menu');
  const navMobile = document.getElementById('nav-menu-mobile');

  let menuItems = '';
  let mobileItems = '';

  if (currentUser) {
    menuItems = `
      <button onclick="showPage('welcome')" class="text-sm hover:text-amber-400 transition">🏠 หน้าหลัก</button>
      <button onclick="showPage('matches')" class="text-sm hover:text-amber-400 transition">📅 ตารางแข่ง</button>
      <button onclick="showPage('standings')" class="text-sm hover:text-amber-400 transition">📊 ตารางกลุ่ม</button>
      <button onclick="showPage('champion')" class="text-sm hover:text-amber-400 transition">🏆 ทายแชมป์</button>
      <button onclick="showPage('predictions')" class="text-sm hover:text-amber-400 transition">🎯 ทายผลของฉัน</button>
      <button onclick="showPage('leaderboard')" class="text-sm hover:text-amber-400 transition">🥇 อันดับ</button>
      ${currentUser.is_admin ? '<button onclick="showPage(\'admin\')" class="text-sm hover:text-amber-400 transition">⚙️ Admin</button>' : ''}
      <span class="text-amber-400 text-sm font-semibold">👤 ${currentUser.username}</span>
      <button onclick="logout()" class="text-sm bg-red-600/50 hover:bg-red-600 px-3 py-1 rounded transition">ออก</button>
    `;
    mobileItems = `
      <button onclick="navTo('welcome')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">🏠 หน้าหลัก</button>
      <button onclick="navTo('matches')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">📅 ตารางแข่ง</button>
      <button onclick="navTo('standings')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">📊 ตารางกลุ่ม</button>
      <button onclick="navTo('champion')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">🏆 ทายแชมป์</button>
      <button onclick="navTo('predictions')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">🎯 ทายผลของฉัน</button>
      <button onclick="navTo('leaderboard')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">🥇 อันดับ</button>
      ${currentUser.is_admin ? '<button onclick="navTo(\'admin\')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">⚙️ Admin</button>' : ''}
      <div class="flex items-center justify-between pt-2">
        <span class="text-amber-400 text-sm font-semibold">👤 ${currentUser.username}</span>
        <button onclick="logout()" class="text-sm bg-red-600/50 hover:bg-red-600 px-3 py-1 rounded transition">ออก</button>
      </div>
    `;
  } else {
    menuItems = `
      <button onclick="showPage('welcome')" class="text-sm hover:text-amber-400 transition">🏠 หน้าหลัก</button>
      <button onclick="showPage('matches')" class="text-sm hover:text-amber-400 transition">📅 ตารางแข่ง</button>
      <button onclick="showPage('standings')" class="text-sm hover:text-amber-400 transition">📊 ตารางกลุ่ม</button>
      <button onclick="showPage('champion')" class="text-sm hover:text-amber-400 transition">🏆 ทายแชมป์</button>
      <button onclick="showPage('leaderboard')" class="text-sm hover:text-amber-400 transition">🥇 อันดับ</button>
      <button onclick="showPage('login')" class="text-sm bg-amber-600 hover:bg-amber-500 px-4 py-1 rounded transition">เข้าสู่ระบบ</button>
    `;
    mobileItems = `
      <button onclick="navTo('welcome')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">🏠 หน้าหลัก</button>
      <button onclick="navTo('matches')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">📅 ตารางแข่ง</button>
      <button onclick="navTo('standings')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">📊 ตารางกลุ่ม</button>
      <button onclick="navTo('champion')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">🏆 ทายแชมป์</button>
      <button onclick="navTo('leaderboard')" class="text-left py-2 text-sm hover:text-amber-400 transition border-b border-white/5">🥇 อันดับ</button>
      <button onclick="navTo('login')" class="text-left py-2 text-sm bg-amber-600 hover:bg-amber-500 px-4 rounded transition mt-2">เข้าสู่ระบบ</button>
    `;
  }

  nav.innerHTML = menuItems;
  navMobile.innerHTML = mobileItems;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

function navTo(page) {
  document.getElementById('mobile-menu').classList.add('hidden');
  showPage(page);
}

// Pages
function showPage(page) {
  const content = document.getElementById('app-content');
  switch (page) {
    case 'welcome': renderWelcome(); break;
    case 'login': renderLogin(); break;
    case 'register': renderRegister(); break;
    case 'matches': renderMatches(); break;
    case 'standings': renderStandings(); break;
    case 'champion': renderChampion(); break;
    case 'predictions': renderMyPredictions(); break;
    case 'leaderboard': renderLeaderboard(); break;
    case 'admin': renderAdmin(); break;
    default: renderWelcome();
  }
}

// Welcome Page
function renderWelcome() {
  document.getElementById('app-content').innerHTML = `
    <div class="fade-in">
      <!-- Hero Section -->
      <div class="text-center py-8">
        <div class="text-6xl mb-4">⚽</div>
        <h2 class="text-3xl sm:text-4xl font-bold mb-2">FIFA World Cup 2026™</h2>
        <p class="text-amber-400 text-lg font-semibold mb-1">Prediction Game</p>
        <p class="text-gray-400 text-sm">🇺🇸 United States • 🇲🇽 Mexico • 🇨🇦 Canada</p>
      </div>

      <!-- Info Cards -->
      <div class="grid md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-center card-hover">
          <div class="text-3xl mb-2">🎯</div>
          <h3 class="font-bold text-lg mb-1">ทายผลแมตช์</h3>
          <p class="text-sm text-gray-400">ทายสกอร์ 72 แมตช์รอบแบ่งกลุ่ม ทายผลถูก +3 ทายสกอร์ตรง +5 คะแนน</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-center card-hover">
          <div class="text-3xl mb-2">🏆</div>
          <h3 class="font-bold text-lg mb-1">ทายทีมแชมป์</h3>
          <p class="text-sm text-gray-400">ยิ่งทายเร็ว ยิ่งได้คะแนนเยอะ สูงสุด 50 คะแนนถ้าทายตั้งแต่รอบกลุ่ม</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-center card-hover">
          <div class="text-3xl mb-2">🥇</div>
          <h3 class="font-bold text-lg mb-1">แข่งกับเพื่อน</h3>
          <p class="text-sm text-gray-400">ตารางอันดับคะแนน ดูว่าใครทายแม่นที่สุด!</p>
        </div>
      </div>

      <!-- Tournament Info -->
      <div class="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 class="font-bold text-lg mb-3 text-amber-400">📋 ข้อมูลทัวร์นาเมนต์</h3>
        <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-white">48</div>
            <div class="text-xs text-gray-400">ทีมเข้าร่วม</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">104</div>
            <div class="text-xs text-gray-400">แมตช์ทั้งหมด</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">16</div>
            <div class="text-xs text-gray-400">สนามแข่งขัน</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-white">12</div>
            <div class="text-xs text-gray-400">กลุ่ม (A-L)</div>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
          📅 11 มิถุนายน - 19 กรกฎาคม 2026
        </div>
      </div>

      <!-- Scoring System -->
      <div class="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 class="font-bold text-lg mb-3 text-amber-400">📊 ระบบคะแนน</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold mb-2">🎯 ทายผลแมตช์</h4>
            <table class="w-full text-sm">
              <tr class="border-b border-white/5">
                <td class="py-1.5 text-gray-400">ทายผลแพ้/ชนะ/เสมอ ถูก</td>
                <td class="py-1.5 text-right text-green-400 font-bold">+3 คะแนน</td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="py-1.5 text-gray-400">ทายสกอร์ถูกต้อง (โบนัส)</td>
                <td class="py-1.5 text-right text-amber-400 font-bold">+5 คะแนน</td>
              </tr>
              <tr>
                <td class="py-1.5 text-gray-400">สูงสุดต่อแมตช์</td>
                <td class="py-1.5 text-right text-yellow-300 font-bold">8 คะแนน</td>
              </tr>
            </table>
          </div>
          <div>
            <h4 class="font-semibold mb-2">🏆 ทายทีมแชมป์</h4>
            <table class="w-full text-sm">
              <tr class="border-b border-white/5">
                <td class="py-1.5 text-gray-400">ทายตั้งแต่รอบกลุ่ม</td>
                <td class="py-1.5 text-right text-green-400 font-bold">50 คะแนน</td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="py-1.5 text-gray-400">ทายตอนรอบ 32 ทีม</td>
                <td class="py-1.5 text-right text-amber-400 font-bold">40 คะแนน</td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="py-1.5 text-gray-400">ทายตอนรอบ 16 ทีม</td>
                <td class="py-1.5 text-right font-bold">30 คะแนน</td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="py-1.5 text-gray-400">ทายตอนรอบ 8 ทีม</td>
                <td class="py-1.5 text-right font-bold">20 คะแนน</td>
              </tr>
              <tr>
                <td class="py-1.5 text-gray-400">ทายตอนรอบรองฯ</td>
                <td class="py-1.5 text-right font-bold">10 คะแนน</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center py-6">
        ${currentUser ? `
          <p class="text-gray-400 mb-3">พร้อมแล้ว! ไปทายผลกันเลย</p>
          <button onclick="showPage('matches')" class="bg-amber-600 hover:bg-amber-500 px-8 py-3 rounded-lg font-semibold transition text-lg">📅 ดูตารางแข่ง & ทายผล</button>
        ` : `
          <p class="text-gray-400 mb-3">สมัครสมาชิกฟรี แล้วเริ่มทายผลได้เลย!</p>
          <div class="flex justify-center gap-3">
            <button onclick="showPage('register')" class="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-lg font-semibold transition">📝 สมัครสมาชิก</button>
            <button onclick="showPage('login')" class="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-lg transition">เข้าสู่ระบบ</button>
          </div>
        `}
      </div>

      <!-- Member Leaderboard -->
      <div id="welcome-leaderboard" class="mb-8">
        <div class="text-center py-4 text-gray-400"><div class="inline-block animate-spin">⚽</div> กำลังโหลดตารางคะแนน...</div>
      </div>
    </div>
  `;

  // Load leaderboard after render
  loadWelcomeLeaderboard();
}

async function loadWelcomeLeaderboard() {
  const container = document.getElementById('welcome-leaderboard');
  if (!container) return;

  try {
    const members = await api('/leaderboard/all');

    if (members.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div class="bg-white/10 px-4 py-3 flex items-center justify-between">
          <h3 class="font-bold text-amber-400">🏆 ตารางคะแนนสมาชิก</h3>
          <span class="text-xs text-gray-400">${members.length} คน</span>
        </div>
        <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-white/5">
            <tr>
              <th class="px-2 py-2 text-left text-xs w-8">#</th>
              <th class="px-2 py-2 text-left text-xs">ผู้เล่น</th>
              <th class="px-2 py-2 text-center text-xs">ทายแชมป์</th>
              <th class="px-2 py-2 text-center text-xs">คะแนน</th>
              <th class="px-2 py-2 text-center text-xs hidden sm:table-cell">ทายถูก</th>
              <th class="px-2 py-2 text-center text-xs hidden sm:table-cell">สกอร์ถูก</th>
            </tr>
          </thead>
          <tbody>
    `;

    members.forEach((m, i) => {
      const rank = i + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
      const rowClass = rank <= 3 ? 'bg-amber-400/5' : '';

      // Champion picks - show up to 5 flags
      const champFlags = (m.champion_picks || []).map(p => getFlag(p.team)).join(' ');

      html += `
        <tr class="border-t border-white/5 ${rowClass}">
          <td class="px-2 py-2 font-bold">${medal}</td>
          <td class="px-2 py-2 font-semibold truncate max-w-[100px]">${m.username}</td>
          <td class="px-2 py-2 text-center">${champFlags || '<span class="text-gray-600">-</span>'}</td>
          <td class="px-2 py-2 text-center text-amber-400 font-bold">${m.total_points}</td>
          <td class="px-2 py-2 text-center text-green-400 hidden sm:table-cell">${m.correct_results}</td>
          <td class="px-2 py-2 text-center text-yellow-400 hidden sm:table-cell">${m.correct_scores}</td>
        </tr>
      `;
    });

    html += '</tbody></table></div></div>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '';
  }
}

// Login Page
function renderLogin() {
  document.getElementById('app-content').innerHTML = `
    <div class="max-w-md mx-auto fade-in">
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        <h2 class="text-2xl font-bold text-center mb-6">🔐 เข้าสู่ระบบ</h2>
        <form onsubmit="handleLogin(event)">
          <div class="mb-4">
            <label class="block text-sm mb-1 text-gray-300">ชื่อผู้ใช้ หรือ อีเมล</label>
            <input type="text" id="login-username" required
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none text-white" placeholder="username">
          </div>
          <div class="mb-6">
            <label class="block text-sm mb-1 text-gray-300">รหัสผ่าน</label>
            <input type="password" id="login-password" required
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none text-white" placeholder="••••••">
          </div>
          <button type="submit" class="w-full bg-amber-600 hover:bg-amber-500 py-2 rounded-lg font-semibold transition">เข้าสู่ระบบ</button>
        </form>
        <p class="text-center mt-4 text-sm text-gray-400">
          ยังไม่มีบัญชี? <button onclick="showPage('register')" class="text-amber-400 hover:underline">สมัครสมาชิก</button>
        </p>
      </div>
    </div>
  `;
}

// Register Page
function renderRegister() {
  document.getElementById('app-content').innerHTML = `
    <div class="max-w-md mx-auto fade-in">
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
        <h2 class="text-2xl font-bold text-center mb-6">📝 สมัครสมาชิก</h2>
        <form onsubmit="handleRegister(event)">
          <div class="mb-4">
            <label class="block text-sm mb-1 text-gray-300">ชื่อผู้ใช้</label>
            <input type="text" id="reg-username" required minlength="3"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none text-white" placeholder="username">
          </div>
          <div class="mb-4">
            <label class="block text-sm mb-1 text-gray-300">อีเมล</label>
            <input type="email" id="reg-email" required
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none text-white" placeholder="email@example.com">
          </div>
          <div class="mb-6">
            <label class="block text-sm mb-1 text-gray-300">รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
            <input type="password" id="reg-password" required minlength="6"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none text-white" placeholder="••••••">
          </div>
          <button type="submit" class="w-full bg-green-600 hover:bg-green-500 py-2 rounded-lg font-semibold transition">สมัครสมาชิก</button>
        </form>
        <p class="text-center mt-4 text-sm text-gray-400">
          มีบัญชีแล้ว? <button onclick="showPage('login')" class="text-amber-400 hover:underline">เข้าสู่ระบบ</button>
        </p>
      </div>
    </div>
  `;
}

// Matches Page
async function renderMatches() {
  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="text-center py-10"><div class="inline-block animate-spin text-4xl">⚽</div><p class="mt-2">กำลังโหลด...</p></div>';

  try {
    const matches = await api('/matches');
    const groups = [...new Set(matches.map(m => m.group_name))].sort();

    let html = `
      <div class="fade-in">
        <h2 class="text-2xl font-bold mb-4">📅 ตารางการแข่งขัน - ฟุตบอลโลก 2026</h2>
        <div class="mb-4 flex flex-wrap gap-2">
          <button onclick="filterMatches('all')" class="px-3 py-1 rounded-full text-sm bg-amber-600 hover:bg-amber-500 transition" id="filter-all">ทั้งหมด</button>
          <button onclick="filterMatches('upcoming')" class="px-3 py-1 rounded-full text-sm bg-white/10 hover:bg-white/20 transition" id="filter-upcoming">ยังไม่แข่ง</button>
          <button onclick="filterMatches('live')" class="px-3 py-1 rounded-full text-sm bg-white/10 hover:bg-white/20 transition" id="filter-live">กำลังแข่ง</button>
          <button onclick="filterMatches('finished')" class="px-3 py-1 rounded-full text-sm bg-white/10 hover:bg-white/20 transition" id="filter-finished">จบแล้ว</button>
        </div>
        <div class="mb-4 flex flex-wrap gap-2">
          <button onclick="filterGroup('all')" class="px-3 py-1 rounded-full text-xs bg-blue-600/50 hover:bg-blue-600 transition">ทุกกลุ่ม</button>
          ${groups.map(g => `<button onclick="filterGroup('${g}')" class="px-3 py-1 rounded-full text-xs bg-white/10 hover:bg-white/20 transition">Group ${g}</button>`).join('')}
        </div>
        <div id="matches-list">
    `;

    html += renderMatchCards(matches);
    html += '</div></div>';
    content.innerHTML = html;

    // Store matches for filtering
    window._allMatches = matches;
  } catch (err) {
    content.innerHTML = `<div class="text-center text-red-400 py-10">${err.message}</div>`;
  }
}

function renderMatchCards(matches) {
  if (matches.length === 0) return '<p class="text-center text-gray-400 py-8">ไม่พบการแข่งขัน</p>';

  let currentDate = '';
  let html = '';

  for (const match of matches) {
    // Use Thai time for grouping by date
    const thaiDate = toThaiTime(match.match_date, match.match_time).date;
    if (thaiDate !== currentDate) {
      currentDate = thaiDate;
      html += `<h3 class="text-lg font-semibold text-amber-400 mt-6 mb-3 border-b border-white/10 pb-2">📆 ${formatDate(currentDate)}</h3>`;
    }

    const statusBadge = match.status === 'live'
      ? '<span class="bg-red-500 text-xs px-2 py-0.5 rounded-full animate-pulse">LIVE</span>'
      : match.status === 'finished'
        ? '<span class="bg-gray-600 text-xs px-2 py-0.5 rounded-full">จบ</span>'
        : '<span class="bg-green-600/50 text-xs px-2 py-0.5 rounded-full">รอแข่ง</span>';

    const scoreDisplay = match.status === 'finished'
      ? `<span class="text-2xl font-bold">${match.score_home ?? '-'} - ${match.score_away ?? '-'}</span>`
      : match.status === 'live'
        ? `<span class="text-2xl font-bold">${match.score_home ?? 0} - ${match.score_away ?? 0}</span>`
        : `<span class="text-lg text-gray-400">${formatMatchTime(match.match_date, match.match_time)}</span>`;

    const predictBtn = currentUser && match.status === 'upcoming'
      ? `<button onclick="openPredictModal(${match.id})" class="mt-2 bg-amber-600 hover:bg-amber-500 px-4 py-1 rounded text-sm transition">🎯 ทายผล</button>`
      : '';

    html += `
      <div class="bg-white/5 border border-white/10 rounded-lg p-4 mb-3 card-hover" data-status="${match.status}" data-group="${match.group_name}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-400">Group ${match.group_name} • ${match.venue}</span>
          ${statusBadge}
        </div>
        <div class="flex items-center justify-between">
          <div class="flex-1 text-right">
            <span class="font-semibold">${match.team_home}</span>
            <span class="ml-2 text-lg">${getFlag(match.team_home)}</span>
          </div>
          <div class="px-4 text-center min-w-[100px]">
            ${scoreDisplay}
          </div>
          <div class="flex-1 text-left">
            <span class="text-lg">${getFlag(match.team_away)}</span>
            <span class="ml-2 font-semibold">${match.team_away}</span>
          </div>
        </div>
        <div class="text-center">${predictBtn}</div>
      </div>
    `;
  }

  return html;
}

function filterMatches(status) {
  const matches = window._allMatches;
  const filtered = status === 'all' ? matches : matches.filter(m => m.status === status);
  document.getElementById('matches-list').innerHTML = renderMatchCards(filtered);
}

function filterGroup(group) {
  const matches = window._allMatches;
  const filtered = group === 'all' ? matches : matches.filter(m => m.group_name === group);
  document.getElementById('matches-list').innerHTML = renderMatchCards(filtered);
}

// Predict Modal
async function openPredictModal(matchId) {
  const match = window._allMatches.find(m => m.id === matchId);
  if (!match) return;

  // Check existing prediction
  let existing = null;
  try {
    existing = await api(`/predictions/match/${matchId}`);
  } catch (e) {}

  const modal = document.createElement('div');
  modal.id = 'predict-modal';
  modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 fade-in';
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
      <h3 class="text-xl font-bold text-center mb-4">🎯 ทายผลการแข่งขัน</h3>
      <p class="text-center text-sm text-gray-400 mb-4">Group ${match.group_name} • ${formatMatchDate(match.match_date, match.match_time)} • ${formatMatchTime(match.match_date, match.match_time)}</p>
      
      <div class="flex items-center justify-between mb-6">
        <div class="text-center flex-1">
          <div class="mb-1">${getFlagLarge(match.team_home)}</div>
          <div class="font-semibold text-sm">${match.team_home}</div>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" id="pred-home" min="0" max="20" value="${existing ? existing.predicted_home : 0}"
            class="score-input bg-white/10 border border-white/30 rounded-lg py-2 text-xl font-bold text-center text-white focus:border-amber-400 focus:outline-none">
          <span class="text-xl font-bold">-</span>
          <input type="number" id="pred-away" min="0" max="20" value="${existing ? existing.predicted_away : 0}"
            class="score-input bg-white/10 border border-white/30 rounded-lg py-2 text-xl font-bold text-center text-white focus:border-amber-400 focus:outline-none">
        </div>
        <div class="text-center flex-1">
          <div class="mb-1">${getFlagLarge(match.team_away)}</div>
          <div class="font-semibold text-sm">${match.team_away}</div>
        </div>
      </div>

      <div class="bg-white/5 rounded-lg p-3 mb-4 text-sm text-gray-300">
        <p>📌 <strong>ระบบคะแนน:</strong></p>
        <p>• ทายผลแพ้/ชนะ/เสมอ ถูก = <span class="text-green-400 font-bold">+3 คะแนน</span></p>
        <p>• ทายสกอร์ถูกต้อง = <span class="text-amber-400 font-bold">+5 คะแนน (โบนัส)</span></p>
        <p>• สูงสุดต่อแมตช์ = <span class="text-yellow-300 font-bold">8 คะแนน</span></p>
      </div>

      <div class="flex gap-3">
        <button onclick="closePredictModal()" class="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg transition">ยกเลิก</button>
        <button onclick="submitPrediction(${matchId})" class="flex-1 bg-amber-600 hover:bg-amber-500 py-2 rounded-lg font-semibold transition">✅ ยืนยัน</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closePredictModal(); });
}

function closePredictModal() {
  const modal = document.getElementById('predict-modal');
  if (modal) modal.remove();
}

async function submitPrediction(matchId) {
  const predicted_home = parseInt(document.getElementById('pred-home').value);
  const predicted_away = parseInt(document.getElementById('pred-away').value);

  try {
    await api('/predictions', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId, predicted_home, predicted_away })
    });
    showToast('บันทึกการทายผลสำเร็จ! 🎯');
    closePredictModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// My Predictions Page
async function renderMyPredictions() {
  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="text-center py-10"><div class="inline-block animate-spin text-4xl">⚽</div></div>';

  try {
    const predictions = await api('/predictions/my');
    let totalPoints = 0;

    let html = `
      <div class="fade-in">
        <h2 class="text-2xl font-bold mb-4">🎯 การทายผลของฉัน</h2>
    `;

    if (predictions.length === 0) {
      html += '<p class="text-gray-400 text-center py-8">ยังไม่มีการทายผล - ไปทายผลได้ที่หน้าตารางแข่ง!</p>';
    } else {
      html += '<div class="grid gap-3">';
      for (const pred of predictions) {
        totalPoints += pred.points_earned;
        const isCorrectResult = pred.status === 'finished' && pred.points_earned >= 3;
        const isCorrectScore = pred.status === 'finished' && pred.points_earned >= 8;

        const resultIcon = pred.status !== 'finished' ? '⏳'
          : isCorrectScore ? '🎯'
          : isCorrectResult ? '✅'
          : '❌';

        html += `
          <div class="bg-white/5 border border-white/10 rounded-lg p-4 ${isCorrectScore ? 'border-amber-400/50' : isCorrectResult ? 'border-green-400/30' : ''}">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-400">Group ${pred.group_name} • ${formatDate(pred.match_date)}</span>
              <span class="text-lg">${resultIcon}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <span>${getFlag(pred.team_home)} ${pred.team_home}</span>
                <span class="text-gray-400"> vs </span>
                <span>${pred.team_away} ${getFlag(pred.team_away)}</span>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-400">ทาย: <span class="text-white font-bold">${pred.predicted_home} - ${pred.predicted_away}</span></div>
                ${pred.status === 'finished' ? `<div class="text-sm text-gray-400">จริง: <span class="text-amber-400 font-bold">${pred.score_home} - ${pred.score_away}</span></div>` : ''}
                ${pred.points_earned > 0 ? `<div class="text-green-400 font-bold text-sm">+${pred.points_earned} pts</div>` : ''}
              </div>
            </div>
          </div>
        `;
      }
      html += '</div>';
      html += `<div class="mt-4 text-center bg-white/10 rounded-lg p-4">
        <p class="text-lg">คะแนนรวม: <span class="text-2xl font-bold text-amber-400">${totalPoints}</span> คะแนน</p>
        <p class="text-sm text-gray-400">จากการทายผลทั้งหมด ${predictions.length} แมตช์</p>
      </div>`;
    }

    html += '</div>';
    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<div class="text-center text-red-400 py-10">${err.message}</div>`;
  }
}

// Champion Prediction Page
async function renderChampion() {
  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="text-center py-10"><div class="inline-block animate-spin text-4xl">🏆</div></div>';

  try {
    const status = await api('/champion/status');
    const stats = await api('/champion/stats');
    let myPredictions = null;

    if (currentUser) {
      try { myPredictions = await api('/champion/my'); } catch(e) {}
    }

    let html = `<div class="fade-in">`;

    // Header
    html += `
      <h2 class="text-2xl font-bold mb-2">🏆 ทายทีมแชมป์ฟุตบอลโลก 2026</h2>
      <p class="text-gray-400 mb-4">ทายทีมแชมป์ได้ตลอด ยิ่งทายเร็วยิ่งได้คะแนนเยอะ!</p>
    `;

    // Champion announced?
    if (status.champion_team) {
      html += `
        <div class="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border border-amber-500/50 rounded-xl p-6 mb-6 text-center">
          <div class="text-5xl mb-2">${getFlag(status.champion_team)}</div>
          <h3 class="text-2xl font-bold text-amber-400">🏆 แชมป์: ${status.champion_team}</h3>
          <p class="text-gray-300 mt-1">ยินดีกับทุกคนที่ทายถูก!</p>
        </div>
      `;
    }

    // Scoring rules
    html += `
      <div class="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <h3 class="font-bold text-lg mb-3 text-amber-400">📌 กติกาคะแนน</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-sm">
          ${Object.entries(status.round_points).filter(([k,v]) => k !== 'final').map(([round, pts]) => `
            <div class="bg-white/5 rounded-lg p-3 ${status.current_round === round ? 'border-2 border-amber-400' : 'border border-white/10'}">
              <div class="text-xs text-gray-400">${status.round_names[round]}</div>
              <div class="text-xl font-bold ${status.current_round === round ? 'text-amber-400' : 'text-white'}">${pts}</div>
              <div class="text-xs text-gray-500">คะแนน</div>
              ${status.current_round === round ? '<div class="text-xs text-green-400 mt-1">◀ รอบปัจจุบัน</div>' : ''}
            </div>
          `).join('')}
        </div>
        <p class="text-xs text-gray-500 mt-3">* ได้คะแนนจากรอบที่ทายถูกเร็วที่สุดเพียงรอบเดียว • เปลี่ยนใจได้ภายในรอบเดิม • ปิดรับเมื่อถึงรอบชิงชนะเลิศ</p>
      </div>
    `;

    // Current round status
    const canPredict = !status.is_locked && status.current_round !== 'final' && !status.round_started;
    html += `
      <div class="flex items-center gap-3 mb-4">
        <span class="text-sm ${canPredict ? 'text-green-400' : 'text-red-400'}">
          ${canPredict ? '🟢 เปิดรับทายผล' : status.round_started ? '🔒 ล็อคแล้ว (รอบนี้เริ่มแข่งแล้ว)' : '🔴 ปิดรับทายผลแล้ว'}
        </span>
        <span class="text-sm text-gray-400">| รอบปัจจุบัน: <strong class="text-white">${status.round_names[status.current_round]}</strong></span>
        ${canPredict ? `<span class="text-sm text-amber-400">| ถ้าทายถูกรอบนี้ได้ <strong>${status.points_available} คะแนน</strong></span>` : ''}
      </div>
    `;

    // My predictions
    if (myPredictions && myPredictions.predictions.length > 0) {
      html += `
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <h3 class="font-semibold mb-3">📝 การทายแชมป์ของฉัน</h3>
          <div class="grid gap-2">
            ${myPredictions.predictions.map(p => `
              <div class="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2">
                <div>
                  <span class="mr-2">${getFlag(p.team)}</span>
                  <span class="font-semibold">${p.team}</span>
                </div>
                <div class="text-right">
                  <span class="text-xs text-gray-400">${p.round_name}</span>
                  ${p.points_earned > 0 ? `<span class="ml-2 text-green-400 font-bold">+${p.points_earned} pts</span>` : `<span class="ml-2 text-xs text-gray-500">(ลุ้น ${p.potential_points} pts)</span>`}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Team selection (only if can predict and logged in)
    if (canPredict && currentUser) {
      // Find my current pick for this round
      const currentPick = myPredictions?.predictions.find(p => p.round === status.current_round);

      html += `
        <div class="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          <h3 class="font-semibold mb-3">🎯 เลือกทีมแชมป์ของคุณ ${currentPick ? `(เลือกอยู่: ${getFlag(currentPick.team)} ${currentPick.team})` : ''}</h3>
          <div class="mb-3">
            <input type="text" id="champion-search" placeholder="🔍 ค้นหาทีม..." oninput="filterChampionTeams()"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none text-white text-sm">
          </div>
          <div id="champion-teams-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
            ${status.teams.sort().map(team => `
              <button onclick="submitChampionPick('${team}')" 
                class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition
                  ${currentPick?.team === team ? 'bg-amber-600 border-amber-400' : 'bg-white/5 hover:bg-white/10 border-white/10'} border">
                <span>${getFlag(team)}</span>
                <span class="truncate">${team}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    } else if (canPredict && !currentUser) {
      html += `
        <div class="text-center py-6 bg-white/5 rounded-xl border border-white/10 mb-6">
          <p class="text-gray-400">กรุณา <button onclick="showPage('login')" class="text-amber-400 hover:underline">เข้าสู่ระบบ</button> เพื่อทายทีมแชมป์</p>
        </div>
      `;
    }

    // Popular picks stats
    if (stats.stats.length > 0) {
      html += `
        <div class="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 class="font-semibold mb-3">📊 ทีมยอดนิยม (${stats.total_participants} คนร่วมทาย)</h3>
          <div class="grid gap-2">
            ${stats.stats.slice(0, 10).map((s, i) => {
              const pct = Math.round((s.count / stats.total_participants) * 100);
              return `
                <div class="flex items-center gap-3">
                  <span class="text-sm w-6 text-gray-400">${i + 1}.</span>
                  <span>${getFlag(s.team)}</span>
                  <span class="text-sm font-semibold flex-1">${s.team}</span>
                  <div class="w-32 bg-white/10 rounded-full h-4 overflow-hidden">
                    <div class="bg-amber-500/60 h-full rounded-full" style="width: ${pct}%"></div>
                  </div>
                  <span class="text-sm text-gray-400 w-16 text-right">${s.count} (${pct}%)</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    html += '</div>';
    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<div class="text-center text-red-400 py-10">${err.message}</div>`;
  }
}

function filterChampionTeams() {
  const query = document.getElementById('champion-search').value.toLowerCase();
  const buttons = document.querySelectorAll('#champion-teams-grid button');
  buttons.forEach(btn => {
    const teamName = btn.textContent.toLowerCase();
    btn.style.display = teamName.includes(query) ? '' : 'none';
  });
}

async function submitChampionPick(team) {
  try {
    const result = await api('/champion/predict', {
      method: 'POST',
      body: JSON.stringify({ team })
    });
    showToast(result.message);
    renderChampion(); // refresh page
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Group Standings Page
async function renderStandings() {
  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="text-center py-10"><div class="inline-block animate-spin text-4xl">⚽</div></div>';

  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  let html = `
    <div class="fade-in">
      <h2 class="text-2xl font-bold mb-4">📊 ตารางคะแนนแต่ละกลุ่ม</h2>
      <div class="mb-4 flex flex-wrap gap-2">
        ${groups.map(g => `<button onclick="scrollToGroup('${g}')" class="px-3 py-1 rounded-full text-xs bg-white/10 hover:bg-amber-600 transition font-semibold">Group ${g}</button>`).join('')}
      </div>
      <div id="standings-container" class="grid gap-6 md:grid-cols-2">
  `;

  content.innerHTML = html + '<div class="text-center py-4 col-span-2"><div class="inline-block animate-spin text-2xl">⚽</div> กำลังโหลด...</div></div></div>';

  // Fetch all group standings
  let standingsHtml = '';
  for (const group of groups) {
    try {
      const standings = await api(`/matches/standings/${group}`);
      standingsHtml += renderGroupTable(group, standings);
    } catch (err) {
      standingsHtml += `<div class="bg-white/5 rounded-lg p-4"><p class="text-red-400">Error loading Group ${group}</p></div>`;
    }
  }

  content.innerHTML = `
    <div class="fade-in">
      <h2 class="text-2xl font-bold mb-4">📊 ตารางคะแนนแต่ละกลุ่ม</h2>
      <div class="mb-4 flex flex-wrap gap-2">
        ${groups.map(g => `<button onclick="scrollToGroup('${g}')" class="px-3 py-1 rounded-full text-xs bg-white/10 hover:bg-amber-600 transition font-semibold">Group ${g}</button>`).join('')}
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        ${standingsHtml}
      </div>
    </div>
  `;
}

function renderGroupTable(group, standings) {
  let rows = '';
  standings.forEach((team, i) => {
    const pos = i + 1;
    const qualify = pos <= 2 ? 'bg-green-600/10 border-l-2 border-green-500' : pos === 3 ? 'bg-yellow-600/5 border-l-2 border-yellow-500' : '';
    rows += `
      <tr class="${qualify} hover:bg-white/5">
        <td class="px-2 py-1.5 text-center text-sm">${pos}</td>
        <td class="px-2 py-1.5 text-sm"><span class="mr-1">${getFlag(team.team)}</span>${team.team}</td>
        <td class="px-2 py-1.5 text-center text-sm">${team.played}</td>
        <td class="px-2 py-1.5 text-center text-sm text-green-400">${team.won}</td>
        <td class="px-2 py-1.5 text-center text-sm text-gray-400">${team.drawn}</td>
        <td class="px-2 py-1.5 text-center text-sm text-red-400">${team.lost}</td>
        <td class="px-2 py-1.5 text-center text-sm">${team.gf}:${team.ga}</td>
        <td class="px-2 py-1.5 text-center text-sm ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : 'text-gray-400'}">${team.gd > 0 ? '+' : ''}${team.gd}</td>
        <td class="px-2 py-1.5 text-center text-sm font-bold text-amber-400">${team.points}</td>
      </tr>
    `;
  });

  return `
    <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden" id="group-${group}">
      <div class="bg-white/10 px-4 py-2 font-bold text-amber-400">🏟️ Group ${group}</div>
      <table class="w-full text-sm">
        <thead class="bg-white/5">
          <tr>
            <th class="px-2 py-1.5 text-center">#</th>
            <th class="px-2 py-1.5 text-left">ทีม</th>
            <th class="px-2 py-1.5 text-center">เล่น</th>
            <th class="px-2 py-1.5 text-center">ชนะ</th>
            <th class="px-2 py-1.5 text-center">เสมอ</th>
            <th class="px-2 py-1.5 text-center">แพ้</th>
            <th class="px-2 py-1.5 text-center">ประตู</th>
            <th class="px-2 py-1.5 text-center">+/-</th>
            <th class="px-2 py-1.5 text-center">คะแนน</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="px-3 py-1.5 text-xs text-gray-500 border-t border-white/5">
        <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>ผ่านเข้ารอบ (อันดับ 1-2)
        <span class="inline-block w-2 h-2 bg-yellow-500 rounded-full ml-3 mr-1"></span>ลุ้นอันดับ 3
      </div>
    </div>
  `;
}

function scrollToGroup(group) {
  const el = document.getElementById(`group-${group}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Leaderboard Page
async function renderLeaderboard() {
  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="text-center py-10"><div class="inline-block animate-spin text-4xl">⚽</div></div>';

  try {
    const leaderboard = await api('/leaderboard');

    let html = `
      <div class="fade-in">
        <h2 class="text-2xl font-bold mb-4">🏆 ตารางคะแนน</h2>
    `;

    if (leaderboard.length === 0) {
      html += '<p class="text-gray-400 text-center py-8">ยังไม่มีข้อมูล - รอให้สมาชิกเริ่มทายผลกันก่อน!</p>';
    } else {
      html += `
        <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table class="w-full">
            <thead class="bg-white/10">
              <tr>
                <th class="px-4 py-3 text-left text-sm">#</th>
                <th class="px-4 py-3 text-left text-sm">ผู้เล่น</th>
                <th class="px-4 py-3 text-center text-sm">คะแนน</th>
                <th class="px-4 py-3 text-center text-sm hidden sm:table-cell">ทายถูก</th>
                <th class="px-4 py-3 text-center text-sm hidden sm:table-cell">สกอร์ถูก</th>
                <th class="px-4 py-3 text-center text-sm hidden sm:table-cell">ทายทั้งหมด</th>
              </tr>
            </thead>
            <tbody>
      `;

      leaderboard.forEach((entry, i) => {
        const rank = i + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
        const rowClass = rank <= 3 ? 'bg-amber-400/5' : '';

        html += `
          <tr class="border-t border-white/5 ${rowClass} hover:bg-white/5">
            <td class="px-4 py-3 font-bold">${medal}</td>
            <td class="px-4 py-3 font-semibold">${entry.username}</td>
            <td class="px-4 py-3 text-center text-amber-400 font-bold text-lg">${entry.total_points}</td>
            <td class="px-4 py-3 text-center text-green-400 hidden sm:table-cell">${entry.correct_results}</td>
            <td class="px-4 py-3 text-center text-yellow-400 hidden sm:table-cell">${entry.correct_scores}</td>
            <td class="px-4 py-3 text-center text-gray-400 hidden sm:table-cell">${entry.total_predictions}</td>
          </tr>
        `;
      });

      html += '</tbody></table></div>';
    }

    html += '</div>';
    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<div class="text-center text-red-400 py-10">${err.message}</div>`;
  }
}

// Admin Page
async function renderAdmin() {
  if (!currentUser || !currentUser.is_admin) {
    showPage('matches');
    return;
  }

  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="text-center py-10"><div class="inline-block animate-spin text-4xl">⚽</div></div>';

  try {
    const matches = await api('/matches');

    let html = `
      <div class="fade-in">
        <h2 class="text-2xl font-bold mb-4">⚙️ Admin Panel</h2>

        <!-- Admin Tabs -->
        <div class="mb-4 flex gap-2 border-b border-white/10 pb-2">
          <button onclick="showAdminTab('matches')" id="admin-tab-matches" class="px-4 py-2 text-sm font-semibold rounded-t border-b-2 border-amber-400 text-amber-400">📅 จัดการผลแข่ง</button>
          <button onclick="showAdminTab('users')" id="admin-tab-users" class="px-4 py-2 text-sm font-semibold rounded-t border-b-2 border-transparent text-gray-400 hover:text-white">👥 จัดการสมาชิก</button>
        </div>

        <div id="admin-tab-content">
        <!-- Matches Tab -->
        <div id="admin-panel-matches">
        <div class="mb-4 bg-white/5 border border-white/10 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-amber-400">🔄 ระบบอัพเดทผลอัตโนมัติ</p>
              <p class="text-sm text-gray-400 mt-1">ระบบตรวจสอบผลจาก API ทุก 5 นาที (ต้องตั้งค่า API key)</p>
            </div>
            <button onclick="triggerAutoUpdate()" class="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold transition">
              🔄 ดึงผลตอนนี้
            </button>
          </div>
        </div>

        <div class="mb-4 bg-white/5 border border-amber-500/30 rounded-lg p-4">
          <p class="font-semibold text-amber-400 mb-2">🏆 จัดการทายทีมแชมป์</p>
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <label class="text-xs text-gray-400">รอบปัจจุบัน:</label>
              <select id="admin-champion-round" onchange="adminSetChampionRound()" class="ml-2 bg-gray-700 text-white text-sm px-3 py-1.5 rounded">
                <option value="group">รอบแบ่งกลุ่ม (50 pts)</option>
                <option value="round32">รอบ 32 ทีม (40 pts)</option>
                <option value="round16">รอบ 16 ทีม (30 pts)</option>
                <option value="quarter">รอบ 8 ทีม (20 pts)</option>
                <option value="semi">รอบรองฯ (10 pts)</option>
                <option value="final">รอบชิงฯ (ปิดรับ)</option>
              </select>
              <button onclick="adminLockChampionRound()" class="ml-2 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-sm transition" title="ล็อคเมื่อคู่แรกของรอบนี้เริ่มแข่ง">🔒 ล็อครอบ</button>
            </div>
            <div>
              <label class="text-xs text-gray-400">ประกาศแชมป์:</label>
              <select id="admin-champion-team" class="ml-2 bg-gray-700 text-white text-sm px-3 py-1.5 rounded">
                <option value="">-- เลือกทีมแชมป์ --</option>
                ${ALL_TEAMS_LIST.sort().map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
              <button onclick="adminDeclareChampion()" class="ml-2 bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded text-sm transition">🏆 ประกาศ</button>
            </div>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap gap-2">
          <button onclick="adminFilter('upcoming')" class="px-3 py-1 rounded-full text-sm bg-green-600/50 hover:bg-green-600 transition">รอแข่ง</button>
          <button onclick="adminFilter('live')" class="px-3 py-1 rounded-full text-sm bg-red-600/50 hover:bg-red-600 transition">LIVE</button>
          <button onclick="adminFilter('finished')" class="px-3 py-1 rounded-full text-sm bg-gray-600/50 hover:bg-gray-600 transition">จบแล้ว</button>
          <button onclick="adminFilter('all')" class="px-3 py-1 rounded-full text-sm bg-amber-600/50 hover:bg-amber-600 transition">ทั้งหมด</button>
        </div>
        <div id="admin-matches" class="grid gap-3">
    `;

    html += renderAdminMatchCards(matches);
    html += '</div></div><!-- end matches panel -->';
    html += '<div id="admin-panel-users" class="hidden"></div>';
    html += '</div></div>';
    content.innerHTML = html;
    window._adminMatches = matches;

    // Load champion round setting
    try {
      const champStatus = await api('/champion/status');
      document.getElementById('admin-champion-round').value = champStatus.current_round;
    } catch(e) {}
  } catch (err) {
    content.innerHTML = `<div class="text-center text-red-400 py-10">${err.message}</div>`;
  }
}

function renderAdminMatchCards(matches) {
  let html = '';
  for (const match of matches) {
    const statusColor = match.status === 'live' ? 'border-red-500' : match.status === 'finished' ? 'border-gray-500' : 'border-green-500';

    html += `
      <div class="bg-white/5 border ${statusColor} rounded-lg p-4" id="admin-match-${match.id}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-400">Group ${match.group_name} • ${formatDate(match.match_date)} ${match.match_time}</span>
          <div class="flex gap-2">
            <select onchange="updateMatchStatus(${match.id}, this.value)" class="bg-gray-700 text-white text-xs px-2 py-1 rounded">
              <option value="upcoming" ${match.status === 'upcoming' ? 'selected' : ''}>รอแข่ง</option>
              <option value="live" ${match.status === 'live' ? 'selected' : ''}>LIVE</option>
              <option value="finished" ${match.status === 'finished' ? 'selected' : ''}>จบ</option>
            </select>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <span>${getFlag(match.team_home)} ${match.team_home}</span>
            <span class="text-gray-400"> vs </span>
            <span>${match.team_away} ${getFlag(match.team_away)}</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="number" min="0" max="20" value="${match.score_home ?? ''}" placeholder="-"
              class="w-12 bg-white/10 border border-white/30 rounded px-2 py-1 text-center text-white text-sm" id="admin-home-${match.id}">
            <span>-</span>
            <input type="number" min="0" max="20" value="${match.score_away ?? ''}" placeholder="-"
              class="w-12 bg-white/10 border border-white/30 rounded px-2 py-1 text-center text-white text-sm" id="admin-away-${match.id}">
            <button onclick="updateMatchResult(${match.id})" class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm transition">💾 บันทึก</button>
          </div>
        </div>
      </div>
    `;
  }
  return html;
}

function adminFilter(status) {
  const matches = window._adminMatches;
  const filtered = status === 'all' ? matches : matches.filter(m => m.status === status);
  document.getElementById('admin-matches').innerHTML = renderAdminMatchCards(filtered);
}

async function updateMatchStatus(matchId, status) {
  try {
    await api(`/admin/matches/${matchId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast('อัพเดทสถานะสำเร็จ');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateMatchResult(matchId) {
  const score_home = parseInt(document.getElementById(`admin-home-${matchId}`).value);
  const score_away = parseInt(document.getElementById(`admin-away-${matchId}`).value);

  if (isNaN(score_home) || isNaN(score_away)) {
    showToast('กรุณากรอกสกอร์ให้ครบ', 'error');
    return;
  }

  try {
    const result = await api(`/admin/matches/${matchId}/result`, {
      method: 'PUT',
      body: JSON.stringify({ score_home, score_away })
    });
    showToast(`อัพเดทผลสำเร็จ! คำนวณคะแนนให้ ${result.predictions_updated} คน`);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function triggerAutoUpdate() {
  try {
    showToast('กำลังดึงผลจาก API...', 'success');
    const result = await api('/admin/auto-update', { method: 'POST' });
    showToast(result.message);
    // Refresh admin page
    setTimeout(() => renderAdmin(), 1000);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminSetChampionRound() {
  const round = document.getElementById('admin-champion-round').value;
  try {
    const result = await api('/champion/admin/round', {
      method: 'PUT',
      body: JSON.stringify({ round })
    });
    showToast(result.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminLockChampionRound() {
  if (!confirm('ยืนยันล็อครอบนี้? (คู่แรกเริ่มแข่งแล้ว - สมาชิกจะไม่สามารถทาย/เปลี่ยนทีมแชมป์ได้อีก)')) return;
  try {
    const result = await api('/champion/admin/lock-round', { method: 'PUT' });
    showToast(result.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminDeclareChampion() {
  const team = document.getElementById('admin-champion-team').value;
  if (!team) {
    showToast('กรุณาเลือกทีมแชมป์', 'error');
    return;
  }
  if (!confirm(`ยืนยันประกาศ ${team} เป็นแชมป์ฟุตบอลโลก 2026?`)) return;

  try {
    const result = await api('/champion/admin/champion', {
      method: 'PUT',
      body: JSON.stringify({ team })
    });
    showToast(result.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ======= Admin Tab Switching =======
function showAdminTab(tab) {
  // Update tab buttons
  document.getElementById('admin-tab-matches').className = `px-4 py-2 text-sm font-semibold rounded-t border-b-2 ${tab === 'matches' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`;
  document.getElementById('admin-tab-users').className = `px-4 py-2 text-sm font-semibold rounded-t border-b-2 ${tab === 'users' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'}`;

  // Show/hide panels
  document.getElementById('admin-panel-matches').classList.toggle('hidden', tab !== 'matches');
  document.getElementById('admin-panel-users').classList.toggle('hidden', tab !== 'users');

  if (tab === 'users') {
    loadAdminUsers();
  }
}

// ======= Admin Users Management =======
let adminSelectedUsers = new Set();

async function loadAdminUsers() {
  const panel = document.getElementById('admin-panel-users');
  panel.innerHTML = '<div class="text-center py-6"><div class="inline-block animate-spin text-2xl">⚽</div></div>';

  try {
    const users = await api('/admin/users/scores');
    window._adminUsers = users;

    let html = `
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-gray-400">ทั้งหมด ${users.length} คน</p>
        <div class="flex gap-2">
          <button onclick="adminBulkReset()" id="btn-bulk-reset" class="hidden bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-sm transition">🗑️ Reset ที่เลือก (<span id="bulk-count">0</span>)</button>
        </div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-white/10">
            <tr>
              <th class="px-3 py-2 text-left"><input type="checkbox" id="select-all-users" onchange="toggleSelectAllUsers()" class="rounded"></th>
              <th class="px-3 py-2 text-left">ID</th>
              <th class="px-3 py-2 text-left">ชื่อผู้ใช้</th>
              <th class="px-3 py-2 text-left hidden sm:table-cell">อีเมล</th>
              <th class="px-3 py-2 text-center">คะแนน</th>
              <th class="px-3 py-2 text-center hidden sm:table-cell">ทายถูก</th>
              <th class="px-3 py-2 text-center hidden sm:table-cell">สกอร์ถูก</th>
              <th class="px-3 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const user of users) {
      html += `
        <tr class="border-t border-white/5 hover:bg-white/5" id="user-row-${user.id}">
          <td class="px-3 py-2"><input type="checkbox" class="user-checkbox rounded" value="${user.id}" onchange="toggleUserSelect(${user.id})"></td>
          <td class="px-3 py-2 text-gray-400">${user.id}</td>
          <td class="px-3 py-2 font-semibold">${user.username} ${user.is_admin ? '<span class="text-xs bg-amber-600/30 text-amber-400 px-1 rounded">Admin</span>' : ''}</td>
          <td class="px-3 py-2 text-gray-400 hidden sm:table-cell">${user.email}</td>
          <td class="px-3 py-2 text-center">
            <input type="number" min="0" value="${user.total_points}" class="w-16 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-center text-white text-sm" id="user-points-${user.id}">
          </td>
          <td class="px-3 py-2 text-center text-green-400 hidden sm:table-cell">${user.correct_results}</td>
          <td class="px-3 py-2 text-center text-yellow-400 hidden sm:table-cell">${user.correct_scores}</td>
          <td class="px-3 py-2 text-center">
            <div class="flex gap-1 justify-center">
              <button onclick="adminSaveUserPoints(${user.id})" class="bg-blue-600 hover:bg-blue-500 px-2 py-0.5 rounded text-xs transition" title="บันทึกคะแนน">💾</button>
              <button onclick="adminResetUser(${user.id}, '${user.username}')" class="bg-orange-600 hover:bg-orange-500 px-2 py-0.5 rounded text-xs transition" title="Reset คะแนน">🔄</button>
              ${!user.is_admin ? `<button onclick="adminDeleteUser(${user.id}, '${user.username}')" class="bg-red-600 hover:bg-red-500 px-2 py-0.5 rounded text-xs transition" title="ลบผู้ใช้">❌</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }

    html += '</tbody></table></div>';
    panel.innerHTML = html;
    adminSelectedUsers.clear();
  } catch (err) {
    panel.innerHTML = `<div class="text-center text-red-400 py-6">${err.message}</div>`;
  }
}

function toggleSelectAllUsers() {
  const checked = document.getElementById('select-all-users').checked;
  document.querySelectorAll('.user-checkbox').forEach(cb => {
    cb.checked = checked;
    const userId = parseInt(cb.value);
    if (checked) adminSelectedUsers.add(userId);
    else adminSelectedUsers.delete(userId);
  });
  updateBulkButton();
}

function toggleUserSelect(userId) {
  if (adminSelectedUsers.has(userId)) {
    adminSelectedUsers.delete(userId);
  } else {
    adminSelectedUsers.add(userId);
  }
  updateBulkButton();
}

function updateBulkButton() {
  const btn = document.getElementById('btn-bulk-reset');
  const count = document.getElementById('bulk-count');
  if (adminSelectedUsers.size > 0) {
    btn.classList.remove('hidden');
    count.textContent = adminSelectedUsers.size;
  } else {
    btn.classList.add('hidden');
  }
}

async function adminSaveUserPoints(userId) {
  const points = parseInt(document.getElementById(`user-points-${userId}`).value);
  if (isNaN(points) || points < 0) {
    showToast('คะแนนไม่ถูกต้อง', 'error');
    return;
  }
  try {
    const result = await api(`/admin/users/${userId}/points`, {
      method: 'PUT',
      body: JSON.stringify({ total_points: points })
    });
    showToast(result.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminResetUser(userId, username) {
  if (!confirm(`ยืนยัน Reset คะแนน ${username} เป็น 0?`)) return;
  try {
    const result = await api(`/admin/users/${userId}/reset`, { method: 'POST' });
    showToast(result.message);
    document.getElementById(`user-points-${userId}`).value = 0;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminBulkReset() {
  const count = adminSelectedUsers.size;
  if (!confirm(`ยืนยัน Reset คะแนนทั้ง ${count} คนที่เลือก?`)) return;
  try {
    const result = await api('/admin/users/bulk-reset', {
      method: 'POST',
      body: JSON.stringify({ user_ids: [...adminSelectedUsers] })
    });
    showToast(result.message);
    loadAdminUsers(); // refresh
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminDeleteUser(userId, username) {
  if (!confirm(`⚠️ ยืนยันลบผู้ใช้ ${username}? (ข้อมูลทั้งหมดจะหายไป)`)) return;
  try {
    const result = await api(`/admin/users/${userId}`, { method: 'DELETE' });
    showToast(result.message);
    document.getElementById(`user-row-${userId}`)?.remove();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Auth handlers
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('wc2026_token', token);
    renderNav();
    showToast(`ยินดีต้อนรับ ${currentUser.username}! ⚽`);
    showPage('matches');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('wc2026_token', token);
    renderNav();
    showToast('สมัครสมาชิกสำเร็จ! 🎉');
    showPage('matches');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('wc2026_token');
  renderNav();
  showPage('matches');
  showToast('ออกจากระบบแล้ว');
}

// Init
async function init() {
  if (token) {
    try {
      currentUser = await api('/auth/me');
    } catch (e) {
      token = null;
      localStorage.removeItem('wc2026_token');
    }
  }
  renderNav();
  showPage('welcome');
}

init();
