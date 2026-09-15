const API_BASE = 'https://footyhub-rydr.onrender.com';

async function loadStandings() {
  const tbody = document.getElementById('standings-body');
  const competition = getCompetitionCode();

  try {
    const res = await fetch(`${API_BASE}/api/football/standings?competition=${competition}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    if (!data.standings || data.standings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-note">No standings data yet.</td></tr>';
      return;
    }

    const total = data.standings.length;

    tbody.innerHTML = data.standings.map((team, i) => {
      // Zone classes — competition-aware
      let zoneClass = '';
      if (competition === 'UCL') {
        if (i < 8) zoneClass = 'zone-qualify';
        else if (i < 24) zoneClass = 'zone-playoff';
        else zoneClass = 'zone-danger';
      } else if (competition === 'EPL') {
        if (i < 4) zoneClass = 'zone-qualify';       // UCL spots
        else if (i < 6) zoneClass = 'zone-playoff';  // Europa / Conference
        else if (i >= total - 3) zoneClass = 'zone-danger'; // Relegation
      }

      return `
      <tr class="${zoneClass} fade-in-up" style="--delay: ${i * 0.03}s">
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
        <td><span class="points-badge">${team.points}</span></td>
      </tr>
    `;
    }).join('');
  } catch (err) {
    console.error('Failed to load standings:', err);
    tbody.innerHTML = '<tr><td colspan="10" class="empty-note">Could not load standings. The server may be waking up — try refreshing in a minute.</td></tr>';
  }
}

renderTabs('standings');
loadStandings();