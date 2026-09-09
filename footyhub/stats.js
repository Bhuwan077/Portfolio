const API_BASE = 'https://footyhub-rydr.onrender.com';

const COLUMN_LABELS = {
  goals: 'Goals',
  assists: 'Assists',
  yellowCards: 'Yellow Cards',
  redCards: 'Red Cards'
};

let statsData = null;

function renderTable(key) {
  const tbody = document.getElementById('stats-body');
  const columnLabel = document.getElementById('stat-column-label');
  columnLabel.textContent = COLUMN_LABELS[key];

  const rows = statsData ? statsData[key] : [];
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">No data yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${row.player_name}</td>
      <td>${row.team_name || ''}</td>
      <td><strong>${row.count}</strong></td>
    </tr>
  `).join('');
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
  try {
    const res = await fetch(`${API_BASE}/api/ucl/stats`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    statsData = await res.json();
    renderTable('goals');
  } catch (err) {
    console.error('Failed to load stats:', err);
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">Could not load stats. The server may be waking up — try refreshing in a minute.</td></tr>`;
  }
}

loadStats();
setupSubtabs();