const API_BASE = 'https://footyhub-rydr.onrender.com';

async function loadStandings() {
  const tbody = document.getElementById('standings-body');

  try {
    const res = await fetch(`${API_BASE}/api/ucl/standings`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    if (!data.standings || data.standings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-note">No standings data yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.standings.map((team, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="team-cell">
          ${team.logo_url ? `<img src="${team.logo_url}" alt="${team.name}" class="team-logo">` : ''}
          ${team.name}
        </td>
        <td>${team.played}</td>
        <td>${team.won}</td>
        <td>${team.drawn}</td>
        <td>${team.lost}</td>
        <td>${team.goals_for}</td>
        <td>${team.goals_against}</td>
        <td>${team.goal_difference}</td>
        <td><strong>${team.points}</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load standings:', err);
    tbody.innerHTML = '<tr><td colspan="10" class="empty-note">Could not load standings. The server may be waking up — try refreshing in a minute.</td></tr>';
  }
}

loadStandings();