const API_BASE = 'https://footyhub-rydr.onrender.com';

function playerHTML(p) {
  const initials = (p.name || '')
    .split(' ')
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return `
    <div class="pitch-player">
      <div class="pitch-player-avatar">${initials}</div>
      <div class="pitch-player-label">${p.number ?? ''} ${p.name}</div>
    </div>
  `;
}

function pitchRowsHTML(initialLineup) {
  return initialLineup.map(row => `
    <div class="pitch-row">
      ${row.map(playerHTML).join('')}
    </div>
  `).join('');
}

function substitutesHTML(subs) {
  if (!subs || subs.length === 0) return '';
  return `
    <div class="substitutes-list">
      <h3 class="section-heading">Substitutes</h3>
      ${subs.map(p => `<div class="sub-row">${p.number ?? ''} ${p.name} <span class="sub-position">${p.position || ''}</span></div>`).join('')}
    </div>
  `;
}

function teamPanelHTML(teamName, formation, initialLineup, substitutes) {
  return `
    <div class="team-lineup-panel">
      <div class="team-lineup-header">
        <span>${teamName}</span>
        <span class="formation-badge">${formation || ''}</span>
      </div>
      <div class="pitch">
        ${pitchRowsHTML(initialLineup)}
      </div>
      ${substitutesHTML(substitutes)}
    </div>
  `;
}

async function loadLineup() {
  const container = document.getElementById('lineup-container');
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get('matchId');

  if (!matchId) {
    container.innerHTML = `<p class="empty-note">No match specified.</p>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/ucl/matches/${matchId}/lineup`);

    if (res.status === 404) {
      container.innerHTML = `<p class="empty-note">Lineup not yet available for this match. Lineups are usually published about 40 minutes before kickoff.</p>`;
      return;
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const lu = data.lineup;

    const matchRes = await fetch(`${API_BASE}/api/ucl/matches`);
    const matchData = await matchRes.json();
    const allMatches = [...matchData.live, ...matchData.upcoming, ...matchData.finished];
    const match = allMatches.find(m => String(m.id) === String(matchId));

    const homeName = match ? match.home_team : 'Home';
    const awayName = match ? match.away_team : 'Away';

    container.innerHTML = `
      <h2 class="section-heading">${homeName} vs ${awayName}</h2>
      ${teamPanelHTML(homeName, lu.home_formation, lu.home_initial_lineup, lu.home_substitutes)}
      ${teamPanelHTML(awayName, lu.away_formation, lu.away_initial_lineup, lu.away_substitutes)}
    `;
  } catch (err) {
    console.error('Failed to load lineup:', err);
    container.innerHTML = `<p class="empty-note">Could not load lineup. The server may be waking up — try refreshing in a minute.</p>`;
  }
}

loadLineup();