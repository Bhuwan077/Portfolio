const API_BASE = 'https://footyhub-rydr.onrender.com';

let allPlayers = [];

function populateTeamFilter() {
  const select = document.getElementById('team-filter');
  const teams = [...new Set(allPlayers.map(p => p.team_name))].sort();
  teams.forEach(team => {
    const opt = document.createElement('option');
    opt.value = team;
    opt.textContent = team;
    select.appendChild(opt);
  });
}

function renderPlayers(filterTeam) {
  const tbody = document.getElementById('players-body');
  const rows = filterTeam
    ? allPlayers.filter(p => p.team_name === filterTeam)
    : allPlayers;

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">No players found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(p => `
    <tr>
      <td>${p.jersey_number ?? ''}</td>
      <td>${p.name}</td>
      <td>${p.position || ''}</td>
      <td>${p.team_name}</td>
    </tr>
  `).join('');
}

async function loadPlayers() {
  const tbody = document.getElementById('players-body');
  try {
    const res = await fetch(`${API_BASE}/api/ucl/players`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    allPlayers = data.players || [];

    populateTeamFilter();
    renderPlayers('');

    document.getElementById('team-filter').addEventListener('change', (e) => {
      renderPlayers(e.target.value);
    });
  } catch (err) {
    console.error('Failed to load players:', err);
    tbody.innerHTML = `<tr><td colspan="4" class="empty-note">Could not load players. The server may be waking up — try refreshing in a minute.</td></tr>`;
  }
}

loadPlayers();