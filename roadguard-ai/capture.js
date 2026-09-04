const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const statusEl = document.getElementById('status');
const captureBtn = document.getElementById('captureBtn');
const resultEl = document.getElementById('result');

let currentLat = null;
let currentLng = null;
let isScanning = false;
let isProcessing = false; // prevents overlapping slow requests

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
      statusEl.textContent = "Location error: " + err.message;
    },
    { enableHighAccuracy: true }
  );
}

// Each scan schedules the next one only after it fully finishes —
// so slow requests on the free tier never pile up
function startScanning() {
  isScanning = true;
  captureBtn.style.display = "none";
  scanLoop();
}

async function scanLoop() {
  await captureAndAnalyze();
  setTimeout(scanLoop, 1000);
}

async function captureAndAnalyze() {
  if (currentLat === null || currentLng === null) return;
  if (isProcessing) return;
  if (video.videoWidth === 0 || video.videoHeight === 0) return; // camera not ready yet

  isProcessing = true;
  statusEl.textContent = "🔍 Analyzing frame — can take up to 1-2 min on our free server…";

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  await new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      try {
        if (!blob) {
          statusEl.textContent = "🟢 No damage detected. Scanning…";
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');

        const url = `https://roadguard-ai-backend-3tzd.onrender.com/detect?latitude=${currentLat}&longitude=${currentLng}`;
        const res = await fetch(url, { method: 'POST', body: formData });
        const data = await res.json();

        if (data.detections && data.detections.length > 0) {
          showResult(data.detections);
          statusEl.textContent = "⚠️ Damage found! Resuming scan shortly…";
        } else {
          statusEl.textContent = "🟢 No damage detected. Scanning…";
        }
      } catch (err) {
        statusEl.textContent = "Connection error: " + err.message;
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