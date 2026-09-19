const API_BASE = 'https://footyhub-rydr.onrender.com';

const COLUMN_LABELS = {
  goals: 'Goals',
  assists: 'Assists',
  yellowCards: 'Yellow Cards',
  redCards: 'Red Cards'
};

let statsData = null;

function renderPodium(rows, key) {
  const container = document.getElementById('podium-showcase');
  if (!container) return;

  if (!rows || rows.length < 3) {
    container.innerHTML = '';
    return;
  }

  const top3 = rows.slice(0, 3);
  const ranks = [
    { idx: 0, medal: '🥇', rank: '#1', type: 'gold' },
    { idx: 1, medal: '🥈', rank: '#2', type: 'silver' },
    { idx: 2, medal: '🥉', rank: '#3', type: 'bronze' }
  ];

  container.innerHTML = ranks.map(r => {
    const p = top3[r.idx];
    if (!p) return '';
    return `
      <div class="podium-card podium-card-${r.type} tilt-card fade-in-up" data-tilt data-tilt-max="10">
        <div class="podium-medal">${r.medal}</div>
        <span class="podium-rank">${r.rank}</span>
        <div class="podium-name">${p.player_name}</div>
        <div class="podium-team">${p.team_name || ''}</div>
        <div class="podium-count">${p.count} <span style="font-size:0.55em; font-weight:500; opacity:0.8;">${COLUMN_LABELS[key]}</span></div>
      </div>
    `;
  }).join('');

  if (window.FootyHubTilt) window.FootyHubTilt.init();
}

function renderTable(key) {
  const tbody = document.getElementById('stats-body');
  const columnLabel = document.getElementById('stat-column-label');
  columnLabel.textContent = COLUMN_LABELS[key];

  const rows = statsData ? statsData[key] : [];
  renderPodium(rows, key);

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">No data yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((row, i) => {
    // Podium classes for top 3
    const podiumClass = i === 0 ? 'podium-gold' : i === 1 ? 'podium-silver' : i === 2 ? 'podium-bronze' : '';

    return `
    <tr class="${podiumClass} fade-in-up" style="--delay: ${i * 0.03}s">
      <td>${i + 1}</td>
      <td>${row.player_name}</td>
      <td>${row.team_name || ''}</td>
      <td><span class="stat-badge">${row.count}</span></td>
    </tr>
  `;
  }).join('');
}

function setupSubtabs() {
  const buttons = document.querySelectorAll('.stat-subtab');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTable(btn.dataset.key);
    });
  });
}

async function loadStats() {
  const tbody = document.getElementById('stats-body');
  const competition = getCompetitionCode();
  try {
    const res = await fetch(`${API_BASE}/api/football/stats?competition=${competition}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    statsData = await res.json();
    renderTable('goals');
  } catch (err) {
    console.error('Failed to load stats:', err);
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">Could not load stats. The server may be waking up — try refreshing in a minute.</td></tr>`;
  }
}

renderTabs('stats');
loadStats();
setupSubtabs();