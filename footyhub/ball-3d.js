/* =========================================================
   FootyHub — Free-Floating Interactive 3D Football Engine
   Pure Vanilla Canvas 3D Truncated Icosahedron Geometry & Physics
   ========================================================= */

(function () {
  const canvas = document.getElementById('ball-3d-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Dimension & Scaling
  let size = 90;
  let R = 36;
  let cx = 45;
  let cy = 43;

  function updateCanvasDimensions() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width) || 90;
    const h = Math.round(rect.height) || 90;
    const dpr = window.devicePixelRatio || 1;

    size = w;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cx = size / 2;
    cy = size / 2 - 2;
    R = (size / 2) * 0.76;
  }

  // Position & Velocity State (Free floating, starts at bottom-right corner)
  const isMobile = window.innerWidth <= 600;
  const initialBallSize = isMobile ? 72 : 90;
  const initialMargin = isMobile ? 18 : 32;
  let posX = Math.max(10, window.innerWidth - initialBallSize - initialMargin);
  let posY = Math.max(10, window.innerHeight - initialBallSize - initialMargin);

  let hasInteracted = false;

  let vx = 0;
  let vy = 0;
  let isDragging = false;
  let hasMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastTime = performance.now();
  let bounceScale = 1.0;
  let bounceTarget = 1.0;

  // High-Speed Sparks & Impact Particles
  const sparks = [];
  function addSparks(count, originX, originY, baseVx, baseVy, color = '#70b0ff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      sparks.push({
        x: originX,
        y: originY,
        vx: baseVx * 0.25 + Math.cos(angle) * speed,
        vy: baseVy * 0.25 + Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.05,
        size: 1.5 + Math.random() * 2,
        color
      });
    }
    if (sparks.length > 40) sparks.splice(0, sparks.length - 40);
  }

  function setBallTransform() {
    canvas.style.transform = `translate3d(${Math.round(posX)}px, ${Math.round(posY)}px, 0)`;
  }

  // --- Truncated Icosahedron Mathematical Generation ---
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawPerms = [];
  const signs = [-1, 1];

  function addPermutations(a, b, c) {
    const perms = [[a, b, c], [b, c, a], [c, a, b]];
    for (const p of perms) {
      for (const sx of (p[0] === 0 ? [0] : signs)) {
        for (const sy of (p[1] === 0 ? [0] : signs)) {
          for (const sz of (p[2] === 0 ? [0] : signs)) {
            rawPerms.push([sx * Math.abs(p[0]), sy * Math.abs(p[1]), sz * Math.abs(p[2])]);
          }
        }
      }
    }
  }

  addPermutations(0, 1, 3 * phi);
  addPermutations(2, 1 + 2 * phi, phi);
  addPermutations(1, 2 + phi, 2 * phi);

  // 60 Unique Normalized Vertices
  const vertices = [];
  for (const v of rawPerms) {
    const norm = Math.hypot(v[0], v[1], v[2]) || 1;
    const nv = [v[0] / norm, v[1] / norm, v[2] / norm];
    if (!vertices.some(u => Math.hypot(u[0] - nv[0], u[1] - nv[1], u[2] - nv[2]) < 0.001)) {
      vertices.push(nv);
    }
  }

  // 90 Unique Seam Edges (Connecting vertices at regular distance ~0.4035)
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = Math.hypot(
        vertices[i][0] - vertices[j][0],
        vertices[i][1] - vertices[j][1],
        vertices[i][2] - vertices[j][2]
      );
      if (Math.abs(d - 0.4035) < 0.04) {
        edges.push([vertices[i], vertices[j]]);
      }
    }
  }

  // 12 Regular Pentagons (Centers = 12 Icosahedron vertices)
  const icosaCenters = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ].map(v => {
    const norm = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / norm, v[1] / norm, v[2] / norm];
  });

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

  function norm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  const pentagons = icosaCenters.map(center => {
    const nearest = vertices
      .map((v, i) => ({ i, v, d: Math.hypot(v[0] - center[0], v[1] - center[1], v[2] - center[2]) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map(x => x.v);

    let ref = [1, 0, 0];
    if (Math.abs(center[0]) > 0.9) ref = [0, 1, 0];
    const u = norm(cross(center, ref));
    const v = cross(center, u);

    nearest.sort((a, b) => {
      const da = [a[0] - center[0], a[1] - center[1], a[2] - center[2]];
      const db = [b[0] - center[0], b[1] - center[1], b[2] - center[2]];
      return Math.atan2(dot(da, v), dot(da, u)) - Math.atan2(dot(db, v), dot(db, u));
    });

    return { center, vertices: nearest };
  });

  // --- 3D Rodrigues Rotation Matrix ---
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

  function rotateMatrix(axis, angle) {
    const [x, y, z] = norm(axis);
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

  // Initial tilt for realistic angle
  rotateMatrix([1, 0, 0], -0.32);
  rotateMatrix([0, 1, 0], 0.38);

  // Directional Light Source (from top-left-front)
  const light = norm([-0.45, -0.65, 0.85]);

  updateCanvasDimensions();
  setBallTransform();

  window.addEventListener('resize', () => {
    updateCanvasDimensions();
    const curSize = canvas.offsetWidth || size;
    const curMargin = window.innerWidth <= 600 ? 18 : 32;
    if (!hasInteracted) {
      posX = Math.max(10, window.innerWidth - curSize - curMargin);
      posY = Math.max(10, window.innerHeight - curSize - curMargin);
    } else {
      posX = Math.max(0, Math.min(window.innerWidth - curSize, posX));
      posY = Math.max(0, Math.min(window.innerHeight - curSize, posY));
    }
    setBallTransform();
  });

  // --- Animation & Physics Loop ---
  function render() {
    ctx.clearRect(0, 0, size, size);

    // Dynamic squash & stretch bounce factor
    bounceScale += (bounceTarget - bounceScale) * 0.16;
    const currentR = R * bounceScale;

    // 1. Realistic Drop Shadow
    ctx.save();
    const shadowY = cy + currentR + Math.max(3, currentR * 0.16);
    const shadowGrad = ctx.createRadialGradient(cx, shadowY, 2, cx, shadowY, currentR * 0.86);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.46)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.16)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, shadowY, currentR * 0.84, Math.max(3, currentR * 0.22), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Base Sphere (White Leather Shading)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
    ctx.clip();

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
    baseGrad.addColorStop(0.85, '#cad2dc');
    baseGrad.addColorStop(1, '#8694a4');
    ctx.fillStyle = baseGrad;
    ctx.fill();

    // 3. Hexagon & Panel Seams (90 edges)
    edges.forEach(([v1, v2]) => {
      const t1 = transform(v1);
      const t2 = transform(v2);
      if (t1[2] > -0.05 && t2[2] > -0.05) {
        ctx.beginPath();
        ctx.moveTo(cx + t1[0] * currentR, cy + t1[1] * currentR);
        ctx.lineTo(cx + t2[0] * currentR, cy + t2[1] * currentR);
        ctx.strokeStyle = 'rgba(42, 52, 68, 0.42)';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    });

    // 4. Black Pentagons (12 faces)
    pentagons.forEach(p => {
      const tc = transform(p.center);
      if (tc[2] > -0.05) {
        const transVerts = p.vertices.map(transform);

        ctx.beginPath();
        transVerts.forEach((v, idx) => {
          const px = cx + v[0] * currentR;
          const py = cy + v[1] * currentR;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();

        const diff = Math.max(0, dot(tc, light));
        const cVal = Math.round(18 + diff * 45);
        ctx.fillStyle = `rgb(${cVal}, ${cVal + 2}, ${cVal + 6})`;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    });

    // 5. Specular Sheen & 3D Curvature Overlay
    const sheenGrad = ctx.createRadialGradient(
      cx - currentR * 0.38,
      cy - currentR * 0.42,
      currentR * 0.05,
      cx,
      cy,
      currentR
    );
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.58)');
    sheenGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.16)');
    sheenGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
    sheenGrad.addColorStop(0.9, 'rgba(5, 10, 20, 0.38)');
    sheenGrad.addColorStop(1, 'rgba(5, 10, 20, 0.85)');
    ctx.fillStyle = sheenGrad;
    ctx.fill();

    ctx.restore();

    // 6. Draw Speed & Impact Spark Particles
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.8, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Free-Floating Movement & Physics Step
    const curBallSize = canvas.offsetWidth || size;
    const maxX = window.innerWidth - curBallSize;
    const maxY = window.innerHeight - curBallSize;

    if (!isDragging) {
      const speed = Math.hypot(vx, vy);

      if (speed > 0.08) {
        posX += vx;
        posY += vy;

        // Friction deceleration
        vx *= 0.968;
        vy *= 0.968;

        // High-velocity trailing sparks
        if (speed > 5.5 && Math.random() < 0.65) {
          const nVx = vx / speed;
          const nVy = vy / speed;
          addSparks(2, cx - nVx * (currentR * 0.8), cy - nVy * (currentR * 0.8), -nVx * 2, -nVy * 2, '#70b0ff');
        }

        // Boundary Ricochet Bounces
        const restitution = 0.74;
        if (posX <= 0) {
          posX = 0;
          vx = -vx * restitution;
          bounceScale = 0.88;
          addSparks(8, cx - currentR * 0.7, cy, vx, vy, '#4ade80');
        } else if (posX >= maxX) {
          posX = maxX;
          vx = -vx * restitution;
          bounceScale = 0.88;
          addSparks(8, cx + currentR * 0.7, cy, vx, vy, '#4ade80');
        }

        if (posY <= 0) {
          posY = 0;
          vy = -vy * restitution;
          bounceScale = 0.88;
          addSparks(8, cx, cy - currentR * 0.7, vx, vy, '#4ade80');
        } else if (posY >= maxY) {
          posY = maxY;
          vy = -vy * restitution;
          bounceScale = 0.88;
          addSparks(8, cx, cy + currentR * 0.7, vx, vy, '#4ade80');
        }

        // 3D rolling rotation in motion direction
        rotateMatrix([vy, -vx, 0], speed * 0.032);
      } else {
        vx = 0;
        vy = 0;
        // Idle gentle float-spin
        rotateMatrix([0.4, -1, 0.2], 0.007);
      }

      setBallTransform();
    }

    requestAnimationFrame(render);
  }

  // --- Pointer & Touch Drag Interactions (Anywhere on screen) ---
  canvas.addEventListener('pointerdown', e => {
    hasInteracted = true;
    isDragging = true;
    hasMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastTime = performance.now();
    vx = 0;
    vy = 0;
    bounceTarget = 0.94;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });

  canvas.addEventListener('pointermove', e => {
    if (!isDragging) return;

    const curX = e.clientX;
    const curY = e.clientY;
    const dx = curX - lastPointerX;
    const dy = curY - lastPointerY;

    if (Math.hypot(curX - dragStartX, curY - dragStartY) > 5) {
      hasMoved = true;
    }

    posX += dx;
    posY += dy;

    // Clamp within viewport during drag
    const curBallSize = canvas.offsetWidth || size;
    const maxX = window.innerWidth - curBallSize;
    const maxY = window.innerHeight - curBallSize;
    posX = Math.max(0, Math.min(maxX, posX));
    posY = Math.max(0, Math.min(maxY, posY));

    // Calculate instantaneous velocity for toss/flick
    const now = performance.now();
    const dt = Math.max(10, now - lastTime);
    lastTime = now;
    vx = dx * (16 / dt);
    vy = dy * (16 / dt);

    // Roll 3D ball in motion direction
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      rotateMatrix([dy, -dx, 0], dist * 0.035);
    }

    lastPointerX = curX;
    lastPointerY = curY;
    setBallTransform();
  });

  function releasePointer(e) {
    if (!isDragging) return;
    isDragging = false;
    bounceTarget = 1.0;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}

    // If clicked/tapped without significant drag, it's a kick!
    if (!hasMoved) {
      const rect = canvas.getBoundingClientRect();
      const ballCenterX = rect.left + rect.width / 2;
      const ballCenterY = rect.top + rect.height / 2;
      let kx = ballCenterX - e.clientX;
      let ky = ballCenterY - e.clientY;

      // If clicked near center, launch with random upward kick
      if (Math.hypot(kx, ky) < 4) {
        kx = (Math.random() - 0.5) * 14;
        ky = -10 - Math.random() * 8;
      }

      const len = Math.hypot(kx, ky) || 1;
      const kickSpeed = 16 + Math.random() * 8;
      vx = (kx / len) * kickSpeed;
      vy = (ky / len) * kickSpeed;
      bounceScale = 1.25;
      addSparks(12, cx, cy, vx * 0.35, vy * 0.35, '#ffd700');
    } else {
      // Cap maximum fling velocity
      const speed = Math.hypot(vx, vy);
      const maxSpeed = 32;
      if (speed > maxSpeed) {
        vx = (vx / speed) * maxSpeed;
        vy = (vy / speed) * maxSpeed;
      }
    }
  }

  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);

  // Start Animation Loop
  requestAnimationFrame(render);
})();
