const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const statusEl = document.getElementById('status');
const captureBtn = document.getElementById('captureBtn');
const resultEl = document.getElementById('result');

let currentLat = null;
let currentLng = null;
let isScanning = false;
let isProcessing = false;

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;
    statusEl.textContent = "Camera ready. Waiting for GPS…";
  } catch (err) {
    statusEl.textContent = "Camera access denied or unavailable: " + err.message;
  }
}

function startLocation() {
  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation not supported by this browser.";
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      currentLat = pos.coords.latitude;
      currentLng = pos.coords.longitude;
      if (!isScanning) startScanning();
    },
    (err) => {
      // This now actually fires within 15s instead of hanging forever,
      // thanks to the timeout option below
      statusEl.textContent = "Location error: " + err.message + " — check that Location is allowed for this site.";
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}

function startScanning() {
  isScanning = true;
  captureBtn.style.display = "none";
  statusEl.textContent = "🟢 Scanning for road damage…";

  tryCapture();
  setInterval(tryCapture, 25000);
}

function tryCapture() {
  if (isProcessing) return;
  captureAndAnalyze();
}

async function captureAndAnalyze() {
  if (currentLat === null || currentLng === null) return;
  if (video.videoWidth === 0 || video.videoHeight === 0) return;

  isProcessing = true;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  await new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      try {
        if (!blob) return;

        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');

        const url = `https://roadguard-ai-backend-3tzd.onrender.com/detect?latitude=${currentLat}&longitude=${currentLng}`;
        const res = await fetch(url, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.detections && data.detections.length > 0) {
          showResult(data.detections);
          statusEl.textContent = "⚠️ Pothole detected! Added to dashboard.";
          setTimeout(() => {
            statusEl.textContent = "🟢 Scanning for road damage…";
          }, 5000);
        }
      } catch (err) {
        console.error("Detection request failed:", err);
      } finally {
        resolve();
      }
    }, 'image/jpeg', 0.85);
  });

  isProcessing = false;
}

function showResult(detections) {
  const card = detections.map(d => `
    <div class="result-card ${d.severity}">
      <div class="type">${d.damage_type}</div>
      <div class="meta">Confidence: ${(d.confidence * 100).toFixed(0)}% · Severity: ${d.severity}</div>
    </div>
  `).join('');
  resultEl.innerHTML = card + resultEl.innerHTML;
}

startCamera();
startLocation();