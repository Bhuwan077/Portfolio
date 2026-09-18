/* =========================================================
   FootyHub — Interactive 3D Playable Football Widget
   Pure Vanilla Canvas 3D Truncated Icosahedron Mathematics
   ========================================================= */

(function () {
  const canvas = document.getElementById('ball-3d-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  let width = 100;
  let height = 100;
  let cx = 50;
  let cy = 46;
  let R = 36;

  function updateDimensions() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width) || canvas.clientWidth || 100;
    const h = Math.round(rect.height) || canvas.clientHeight || 100;
    const dpr = window.devicePixelRatio || 1;

    if (w > 0 && h > 0) {
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        width = w;
        height = h;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = width / 2;
        cy = height / 2 - Math.max(2, height * 0.035);
        R = Math.min(width, height) * 0.36;
      }
    }
  }

  updateDimensions();
  window.addEventListener('resize', updateDimensions);

  // Golden ratio
  const phi = (1 + Math.sqrt(5)) / 2;

  // 12 icosahedron vertices (centers of the 12 pentagons)
  const rawVerts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];

  function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  const centers = rawVerts.map(normalize);

  // For each center, find its 5 nearest neighbors and sort cyclically
  const pentagons = centers.map((c, i) => {
    // Distance to all other centers
    const others = centers
      .map((other, idx) => ({ idx, other, dist: Math.hypot(c[0] - other[0], c[1] - other[1], c[2] - other[2]) }))
      .filter(item => item.idx !== i)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);

    // Pick a reference vector orthogonal to c
    let ref = [1, 0, 0];
    if (Math.abs(c[0]) > 0.9) ref = [0, 1, 0];
    const u = normalize(cross(c, ref));
    const v = cross(c, u);

    // Sort neighbors cyclically around c
    others.sort((a, b) => {
      const da = [a.other[0] - c[0], a.other[1] - c[1], a.other[2] - c[2]];
      const db = [b.other[0] - c[0], b.other[1] - c[1], b.other[2] - c[2]];
      const angleA = Math.atan2(dot(da, v), dot(da, u));
      const angleB = Math.atan2(dot(db, v), dot(db, u));
      return angleA - angleB;
    });

    // Create 5 vertices on the sphere for this pentagon
    // Radius factor 0.355 is mathematically matched to standard soccer ball panel proportions
    const vertices = others.map(item => {
      const dir = [
        c[0] + 0.355 * (item.other[0] - c[0]),
        c[1] + 0.355 * (item.other[1] - c[1]),
        c[2] + 0.355 * (item.other[2] - c[2])
      ];
      return normalize(dir);
    });

    return { center: c, vertices };
  });

  // Calculate hexagon seams connecting adjacent pentagons
  const seams = [];
  for (let i = 0; i < pentagons.length; i++) {
    for (let j = i + 1; j < pentagons.length; j++) {
      const p1 = pentagons[i];
      const p2 = pentagons[j];
      const dist = Math.hypot(p1.center[0] - p2.center[0], p1.center[1] - p2.center[1], p1.center[2] - p2.center[2]);
      if (dist < 1.15) { // Adjacent
        // Find the 2 closest pairs of vertices
        const pairs = [];
        p1.vertices.forEach(v1 => {
          p2.vertices.forEach(v2 => {
            pairs.push({ v1, v2, d: Math.hypot(v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]) });
          });
        });
        pairs.sort((a, b) => a.d - b.d);
        if (pairs[0] && pairs[1]) {
          seams.push([pairs[0].v1, pairs[0].v2]);
          seams.push([pairs[1].v1, pairs[1].v2]);
        }
      }
    }
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  // 3x3 Rotation matrix
  let matrix = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  function transform(v) {
    return [
      matrix[0][0] * v[0] + matrix[0][1] * v[1] + matrix[0][2] * v[2],
      matrix[1][0] * v[0] + matrix[1][1] * v[1] + matrix[1][2] * v[2],
      matrix[2][0] * v[0] + matrix[2][1] * v[1] + matrix[2][2] * v[2]
    ];
  }

  // Rodrigues rotation formula on matrix
  function rotateMatrix(axis, angle) {
    const [x, y, z] = normalize(axis);
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const t = 1 - c;

    const rot = [
      [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
      [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
      [t * x * z - s * y, t * y * z + s * x, t * z * z + c]
    ];

    const res = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];

    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 3; col++) {
        res[r][col] = rot[r][0] * matrix[0][col] + rot[r][1] * matrix[1][col] + rot[r][2] * matrix[2][col];
      }
    }
    matrix = res;
  }

  // Initial tilt for realistic broadcast angle
  rotateMatrix([1, 0, 0], -0.35);
  rotateMatrix([0, 1, 0], 0.4);

  // Physics & Interaction State
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let velX = 0.008;
  let velY = 0.004;
  let bounceScale = 1.0;
  let bounceTarget = 1.0;

  // Light source (top-left-front)
  const light = normalize([-0.45, -0.65, 0.85]);

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Bounce physics
    bounceScale += (bounceTarget - bounceScale) * 0.15;
    const currentR = R * bounceScale;

    // 1. Drop shadow beneath ball
    ctx.save();
    const shadowY = cy + currentR + Math.max(4, currentR * 0.18);
    const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, currentR * 0.88);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.48)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, shadowY, currentR * 0.85, Math.max(3, currentR * 0.22), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Base white sphere with 3D spherical lighting
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
    ctx.clip();

    // White leather background
    const baseGrad = ctx.createRadialGradient(
      cx - currentR * 0.35,
      cy - currentR * 0.4,
      currentR * 0.08,
      cx,
      cy,
      currentR
    );
    baseGrad.addColorStop(0, '#ffffff');
    baseGrad.addColorStop(0.55, '#eaedf2');
    baseGrad.addColorStop(0.85, '#cbd3de');
    baseGrad.addColorStop(1, '#8c9aa8');
    ctx.fillStyle = baseGrad;
    ctx.fill();

    // 3. Draw hexagon seams
    seams.forEach(([v1, v2]) => {
      const t1 = transform(v1);
      const t2 = transform(v2);
      if (t1[2] > -0.15 && t2[2] > -0.15) {
        ctx.beginPath();
        ctx.moveTo(cx + t1[0] * currentR, cy + t1[1] * currentR);
        ctx.lineTo(cx + t2[0] * currentR, cy + t2[1] * currentR);
        ctx.strokeStyle = 'rgba(50, 60, 75, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    });

    // 4. Draw 12 Black Pentagons
    pentagons.forEach(p => {
      const tc = transform(p.center);
      // Backface culling with soft margin
      if (tc[2] > -0.15) {
        const transVerts = p.vertices.map(transform);

        ctx.beginPath();
        transVerts.forEach((v, idx) => {
          const px = cx + v[0] * currentR;
          const py = cy + v[1] * currentR;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();

        // Diffuse lighting on the pentagon
        const diff = Math.max(0, dot(tc, light));
        const cVal = Math.round(18 + diff * 45);
        ctx.fillStyle = `rgb(${cVal}, ${cVal + 2}, ${cVal + 8})`;
        ctx.fill();

        // Subtle seam border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    });

    // 5. 3D Curvature & Specular Highlight Overlay
    const sheenGrad = ctx.createRadialGradient(
      cx - currentR * 0.38,
      cy - currentR * 0.42,
      currentR * 0.05,
      cx,
      cy,
      currentR
    );
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    sheenGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.15)');
    sheenGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
    sheenGrad.addColorStop(0.9, 'rgba(5, 10, 20, 0.4)');
    sheenGrad.addColorStop(1, 'rgba(5, 10, 20, 0.85)');
    ctx.fillStyle = sheenGrad;
    ctx.fill();

    ctx.restore();

    // 6. Physics step
    if (!isDragging) {
      // Rotate by velocity
      const speed = Math.hypot(velX, velY);
      if (speed > 0.0001) {
        rotateMatrix([velY, -velX, 0], speed);
        // Inertia damping
        velX *= 0.965;
        velY *= 0.965;
      } else {
        // Idle gentle float-spin
        rotateMatrix([0.4, -1, 0.2], 0.007);
      }
    }

    requestAnimationFrame(render);
  }

  // Pointer interaction
  canvas.addEventListener('pointerdown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velX = 0;
    velY = 0;
    bounceTarget = 0.95;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });

  canvas.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    velX = dx * 0.015;
    velY = dy * 0.015;

    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      rotateMatrix([dy, -dx, 0], dist * 0.022);
    }
  });

  function releasePointer(e) {
    if (!isDragging) return;
    isDragging = false;
    bounceTarget = 1.0;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);

  // Click bounce kick
  canvas.addEventListener('click', () => {
    bounceScale = 1.18;
    bounceTarget = 1.0;
    velX += (Math.random() - 0.5) * 0.08;
    velY += (Math.random() - 0.5) * 0.08;
  });

  // Start animation loop
  requestAnimationFrame(render);
})();
