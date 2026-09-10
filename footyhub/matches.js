const API_BASE = 'https://footyhub-rydr.onrender.com';

function relativeDateLabel(date) {
  const now = new Date();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kathmandu' });
}

function fixtureCardHTML(m) {
  const date = new Date(m.match_date);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kathmandu' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' });

  return `
    <a href="lineup.html?matchId=${m.id}" class="match-card">
      <div class="match-date">${dateStr} · ${timeStr}</div>
      <div class="match-teams">
        <span class="team">
          ${m.home_logo ? `<img src="${m.home_logo}" class="team-logo">` : ''}
          ${m.home_team}
        </span>
        <span class="vs">vs</span>
        <span class="team">
          ${m.away_logo ? `<img src="${m.away_logo}" class="team-logo">` : ''}
          ${m.away_team}
        </span>
      </div>
    </a>
  `;
}

function resultCardHTML(m) {
  const date = new Date(m.match_date);
  const label = relativeDateLabel(date);
  const homeWon = m.home_score > m.away_score;
  const awayWon = m.away_score > m.home_score;

  return `
    <a href="lineup.html?matchId=${m.id}" class="result-card">
      <div class="result-body">
        <div class="result-row">
          <span class="result-team">
            ${m.home_logo ? `<img src="${m.home_logo}" class="team-logo">` : ''}
            ${m.home_team}
          </span>
          <span class="result-score">${m.home_score} ${homeWon ? '<span class="win-arrow">&#9664;</span>' : ''}</span>
        </div>
        <div class="result-row">
          <span class="result-team">
            ${m.away_logo ? `<img src="${m.away_logo}" class="team-logo">` : ''}
            ${m.away_team}
          </span>
          <span class="result-score">${m.away_score} ${awayWon ? '<span class="win-arrow">&#9664;</span>' : ''}</span>
        </div>
      </div>
      <div class="result-meta">FT<br>${label}</div>
    </a>
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
      liveList.innerHTML = data.live.map(m => resultCardHTML(m)).join('');
    }

    upcomingList.innerHTML = data.upcoming.length
      ? data.upcoming.map(m => fixtureCardHTML(m)).join('')
      : '<p class="empty-note">No upcoming matches.</p>';

    finishedList.innerHTML = data.finished.length
      ? data.finished.map(m => resultCardHTML(m)).join('')
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