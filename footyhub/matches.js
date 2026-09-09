const API_BASE = 'https://footyhub-rydr.onrender.com';

function matchCardHTML(m, showScore) {
  const date = new Date(m.match_date);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kathmandu' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' });

  return `
    <div class="match-card">
      <div class="match-date">${dateStr}${showScore ? '' : ' · ' + timeStr}</div>
      <div class="match-teams">
        <span class="team">
          ${m.home_logo ? `<img src="${m.home_logo}" class="team-logo">` : ''}
          ${m.home_team}
        </span>
        ${showScore
          ? `<span class="score">${m.home_score} - ${m.away_score}</span>`
          : `<span class="vs">vs</span>`}
        <span class="team">
          ${m.away_logo ? `<img src="${m.away_logo}" class="team-logo">` : ''}
          ${m.away_team}
        </span>
      </div>
    </div>
  `;
}

async function loadMatches() {
  const liveSection = document.getElementById('live-section');
  const liveList = document.getElementById('live-list');
  const upcomingList = document.getElementById('upcoming-list');
  const finishedList = document.getElementById('finished-list');

  try {
    const res = await fetch(`${API_BASE}/api/ucl/matches`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();

    if (data.live && data.live.length > 0) {
      liveSection.style.display = 'block';
      liveList.innerHTML = data.live.map(m => matchCardHTML(m, true)).join('');
    }

    upcomingList.innerHTML = data.upcoming.length
      ? data.upcoming.map(m => matchCardHTML(m, false)).join('')
      : '<p class="empty-note">No upcoming matches.</p>';

    finishedList.innerHTML = data.finished.length
      ? data.finished.map(m => matchCardHTML(m, true)).join('')
      : '<p class="empty-note">No finished matches yet.</p>';
  } catch (err) {
    console.error('Failed to load matches:', err);
    upcomingList.innerHTML = '<p class="empty-note">Could not load matches. The server may be waking up — try refreshing in a minute.</p>';
    finishedList.innerHTML = '';
  }
}

function setupResultsToggle() {
  const toggleBtn = document.getElementById('results-toggle');
  const finishedList = document.getElementById('finished-list');
  const arrow = document.getElementById('results-arrow');

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = finishedList.classList.toggle('collapsed');
    arrow.innerHTML = isCollapsed ? '&#9660;' : '&#9650;';
  });
}

loadMatches();
setupResultsToggle();