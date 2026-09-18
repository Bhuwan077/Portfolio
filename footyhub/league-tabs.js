const LEAGUES = {
  ucl: {
    name: 'Champions League',
    competition: 'UCL',
    hasStats: true,
    hasPlayers: true,
    bgImages: ['images/ucl-bg-1.jpg', 'images/ucl-bg-2.webp', 'images/ucl-bg-3.jpeg']
  },
  epl: {
    name: 'Premier League',
    competition: 'EPL',
    hasStats: true,
    hasPlayers: true,
    bgImages: ['images/epl-bg-1.jpg', 'images/epl-bg-2.jpg', 'images/epl-bg-3.jpg', 'images/epl-bg-4.jpg']
  },
  laliga: {
    name: 'La Liga',
    competition: 'LALIGA',
    hasStats: true,
    hasPlayers: false,
    bgImages: ['images/laliga-bg-1.jpg', 'images/laliga-bg-2.jpg', 'images/laliga-bg-3.jpg', 'images/laliga-bg-4.jpg', 'images/laliga-bg-5.jpg']
  },
  serieA: {
    name: 'Serie A',
    competition: 'SERIEA',
    hasStats: true,
    hasPlayers: false,
    bgImages: [
  "images/seriea-bg-1.jpg",
  "images/seriea-bg-2.jpg",
  "images/seriea-bg-3.jpg",
  "images/seriea-bg-4.jpg",
  "images/seriea-bg-5.jpg",
]
  },
  bundesliga: {
    name: 'Bundesliga',
    competition: 'BUNDESLIGA',
    hasStats: true,
    hasPlayers: false,
    bgImages: [
  "images/bundesliga-bg-1.jpg",
  "images/bundesliga-bg-2.jpg",
  "images/bundesliga-bg-3.jpg",
  "images/bundesliga-bg-4.jpg",
  "images/bundesliga-bg-5.jpg",
]
  }
};

function getCurrentLeague() {
  const params = new URLSearchParams(window.location.search);
  const rawKey = params.get('league') || 'ucl';
  if (LEAGUES[rawKey]) return rawKey;
  const match = Object.keys(LEAGUES).find(k => k.toLowerCase() === rawKey.toLowerCase());
  return match || 'ucl';
}

function getCompetitionCode() {
  return LEAGUES[getCurrentLeague()].competition;
}

function renderTabs(activeTab) {
  const league = getCurrentLeague();
  document.body.setAttribute('data-league', league);
  const info = LEAGUES[league];
  const suffix = league === 'ucl' ? '' : `?league=${league}`;

  document.getElementById('league-title').textContent = info.name;

  const tabs = [
    { key: 'matches', label: 'Matches', href: `matches.html${suffix}`, enabled: true },
    { key: 'standings', label: 'Standings', href: `standings.html${suffix}`, enabled: true },
    { key: 'stats', label: 'Stats', href: `stats.html${suffix}`, enabled: info.hasStats },
    { key: 'players', label: 'Players', href: `players.html${suffix}`, enabled: info.hasPlayers }
  ];

  const nav = document.getElementById('tabs-nav');
  nav.innerHTML = tabs.map(tab => {
    const activeClass = tab.key === activeTab ? 'tab-active' : '';
    if (!tab.enabled) {
      return `<span class="tab tab-disabled" title="Coming soon for ${info.name}">${tab.label.toUpperCase()}</span>`;
    }
    return `<a href="${tab.href}" class="tab ${activeClass}">${tab.label.toUpperCase()}</a>`;
  }).join('');
}