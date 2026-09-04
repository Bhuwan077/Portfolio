const SUPABASE_URL = "https://cpvfolhfhohrduonzllm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vRniLHL0K84KEBR5fpqBKw_Uht4wKkB";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});

const API_URL = "https://roadguard-ai-backend-3tzd.onrender.com/reports";

const severityColor = {
  Severe: "#E4572E",
  Moderate: "#F2A93B",
  Minor: "#8FB05B"
};

let isAdmin = false;

const map = L.map('map', { zoomControl: true }).setView([27.7, 85.3], 3);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

const markers = {};

async function checkAdminStatus() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  isAdmin = !!session;
  updateAdminUI();
}

function updateAdminUI() {
  const authLink = document.getElementById('auth-link');
  if (!authLink) return;

  if (isAdmin) {
    authLink.textContent = "Log out";
    authLink.href = "#";
    authLink.onclick = async (e) => {
      e.preventDefault();
      await supabaseClient.auth.signOut();
      window.location.reload();
    };
  } else {
    authLink.textContent = "Admin Login";
    authLink.href = "login.html";
  }
}

async function markAsFixed(reportId, buttonEl) {
  buttonEl.disabled = true;
  buttonEl.textContent = "Deleting…";

  const { data, error } = await supabaseClient
    .from('reports')
    .delete()
    .eq('id', reportId)
    .select(); // confirms whether a row actually got deleted

  if (error) {
    alert("Failed to delete: " + error.message);
    buttonEl.disabled = false;
    buttonEl.textContent = "Mark as Fixed";
    return;
  }

  if (!data || data.length === 0) {
    alert("Delete ran but matched 0 rows — likely blocked by permissions (RLS), not a real error.");
    buttonEl.disabled = false;
    buttonEl.textContent = "Mark as Fixed";
    return;
  }

  loadReports(); // refresh the list and map
}

async function loadReports() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const listEl = document.getElementById('list');
    const statsEl = document.getElementById('stats');

    // Clear old markers before redrawing
    Object.values(markers).forEach(m => map.removeLayer(m));

    const openReports = data.filter(r => r.status !== 'fixed');

    if (!openReports.length) {
      listEl.innerHTML = '<div id="empty">No open reports.</div>';
      statsEl.textContent = '0 open reports';
      return;
    }

    statsEl.textContent = `${openReports.length} open reports`;
    listEl.innerHTML = '';

    openReports.forEach(report => {
      const color = severityColor[report.severity] || '#999';

      const imageHtml = report.image_url
        ? `<img src="${report.image_url}" style="width:220px;max-width:100%;border-radius:6px;margin-top:8px;display:block;">`
        : '';

      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 1,
        fillOpacity: 0.9
      }).addTo(map);

      marker.bindPopup(`
        <b>${report.damage_type}</b><br>
        ${report.severity} · ${(report.confidence * 100).toFixed(0)}%
        ${imageHtml}
      `);
      markers[report.id] = marker;

      const adminButton = isAdmin
        ? `<button class="fix-btn" data-id="${report.id}">Mark as Fixed</button>`
        : '';

      const row = document.createElement('div');
      row.className = 'report-row';
      row.innerHTML = `
        <span class="badge ${report.severity}">${report.severity}</span>
        <span class="type">${report.damage_type}</span>
        <div class="meta">
          Confidence: ${(report.confidence * 100).toFixed(0)}% · ${new Date(report.created_at).toLocaleString()}
        </div>
        ${adminButton}
      `;

      row.querySelector('.badge, .type, .meta')?.addEventListener('click', () => {
        map.flyTo([report.latitude, report.longitude], 14);
        markers[report.id].openPopup();
      });

      const fixBtn = row.querySelector('.fix-btn');
      if (fixBtn) {
        fixBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          markAsFixed(report.id, fixBtn);
        });
      }

      listEl.appendChild(row);
    });
  } catch (err) {
    document.getElementById('list').innerHTML =
      `<div id="empty">Couldn't load reports.<br>Is your FastAPI server running?<br><br>${err}</div>`;
  }
}

checkAdminStatus().then(loadReports);