(() => {
  "use strict";

  const canvas = document.querySelector(".hero canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const stadium = document.createElement("canvas");
  const bg = stadium.getContext("2d");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const TAU = Math.PI * 2;
  const DURATION = 9.4;
  const KICK = 3.9;
  const HIT = 4.64;

  let width, height, sceneWidth, dpr;
  let time = 0;
  let previous = 0;
  let frameId = 0;
  let camera = { zoom: 1, x: 0 };

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => {
    t = clamp(t);
    return t * t * (3 - 2 * t);
  };

  function random(seed) {
    return () => {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
      n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }

  function project(x, y, z = 0) {
    const scale = height / (10 + y * .3);
    const anchor = width - sceneWidth * .235;
    return {
      x: anchor + (x * scale + camera.x) * camera.zoom,
      y: height * .49 +
         ((25 - y) * scale * .24 - z * scale) * camera.zoom,
      s: scale * camera.zoom
    };
  }

  function glow(target, x, y, radius, color) {
    const gradient = target.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(130,190,210,0)");
    target.fillStyle = gradient;
    target.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function path(points, color, lineWidth = 1) {
    ctx.beginPath();
    points.forEach((point, index) => {
      const p = project(...point);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function polygon(points, color) {
    ctx.beginPath();
    points.forEach((point, index) => {
      const p = project(...point);
      if (index === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function buildStadium() {
    stadium.width = Math.round(width * dpr);
    stadium.height = Math.round(height * dpr);
    bg.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sky = bg.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#030911");
    sky.addColorStop(.45, "#17272d");
    sky.addColorStop(1, "#071311");
    bg.fillStyle = sky;
    bg.fillRect(0, 0, width, height);

    const rand = random(182);
    const center = width - sceneWidth * .35;

    for (let tier = 0; tier < 3; tier++) {
      const top = height * (.175 + tier * .097);

      bg.beginPath();
      bg.moveTo(-sceneWidth * .2, top + height * .07);
      bg.quadraticCurveTo(center, top - height * .075,
        width + sceneWidth * .2, top + height * .035);
      bg.lineTo(width + sceneWidth * .2, top + height * .115);
      bg.quadraticCurveTo(center, top + height * .015,
        -sceneWidth * .2, top + height * .15);
      bg.closePath();
      bg.fillStyle = ["#152029", "#1b282e", "#233137"][tier];
      bg.fill();

      bg.beginPath();
      bg.moveTo(-sceneWidth * .2, top + height * .15);
      bg.quadraticCurveTo(center, top + height * .015,
        width + sceneWidth * .2, top + height * .115);
      bg.strokeStyle = "#759090";
      bg.globalAlpha = .28;
      bg.lineWidth = 2;
      bg.stroke();
      bg.globalAlpha = 1;
    }

    const crowdColors = [
      "#586569", "#70817d", "#344750",
      "#9a9580", "#a6b5b2", "#66544d"
    ];

    for (let i = 0; i < 14000; i++) {
      const x = rand() * width;
      const curve = Math.pow((x - center) / sceneWidth, 2);
      const y = height * (.17 + rand() * .29 + curve * .085);
      const size = .6 + rand() * 1.3;

      bg.globalAlpha = .18 + rand() * .52;
      bg.fillStyle = crowdColors[Math.floor(rand() * crowdColors.length)];
      bg.fillRect(x, y, size, size * 1.45);
    }

    bg.globalAlpha = 1;
    bg.fillStyle = "#172e31";
    bg.fillRect(0, height * .465, width, height * .025);
    bg.fillStyle = "#8fbaa9";
    bg.globalAlpha = .35;
    bg.fillRect(0, height * .467, width, 1);
    bg.globalAlpha = 1;

    for (let i = 0; i < 15; i++) {
      const x = i / 14 * width;
      bg.beginPath();
      bg.moveTo(x, 0);
      bg.lineTo(center + (x - center) * .81, height * .14);
      bg.strokeStyle = "rgba(134,160,169,.12)";
      bg.lineWidth = 2;
      bg.stroke();
    }

    for (const [nx, ny] of [[.18, .13], [.53, .095], [.88, .145]]) {
      const x = width - sceneWidth * (1 - nx);
      const y = height * ny;

      glow(bg, x, y, height * .19, "rgba(181,218,235,.22)");
      glow(bg, x, y, height * .065, "rgba(224,245,250,.6)");

      bg.save();
      bg.translate(x, y);
      bg.rotate(-.055);
      bg.fillStyle = "#e6f4f5";

      for (let j = 0; j < 12; j++) {
        bg.fillRect((j - 6) * height * .008, 0,
          height * .005, height * .008);
      }
      bg.restore();
    }
  }

  function pitch() {
    polygon([
      [-40, -10, 0], [40, -10, 0],
      [40, 30, 0], [-40, 30, 0]
    ], "#173d32");

    for (let y = -9; y < 30; y += 3) {
      polygon([
        [-40, y, 0], [40, y, 0],
        [40, y + 3, 0], [-40, y + 3, 0]
      ], Math.round(y / 3) % 2 ? "#16382f" : "#1b4235");
    }

    const white = "rgba(205,222,200,.53)";
    path([[-30, 25, .015], [30, 25, .015]], white, 1.4);
    path([[-10, 25, .015], [-10, 13, .015],
      [10, 13, .015], [10, 25, .015]], white, 1.4);
    path([[-5.5, 25, .015], [-5.5, 20.5, .015],
      [5.5, 20.5, .015], [5.5, 25, .015]], white, 1.2);

    const arc = [];
    for (let i = 0; i <= 32; i++) {
      const a = Math.PI + i / 32 * Math.PI;
      arc.push([Math.cos(a) * 3.2, 13 + Math.sin(a) * 3.2, .02]);
    }
    path(arc, white, 1.3);

    const rand = random(9);
    ctx.strokeStyle = "rgba(152,174,101,.13)";
    ctx.lineWidth = .7;
    ctx.beginPath();

    for (let i = 0; i < 1100; i++) {
      const p = project(rand() * 36 - 18, rand() * 30, 0);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + .8, p.y - 1 - rand() * 2);
    }
    ctx.stroke();
  }

  function netPoint(x, z, t) {
    const elapsed = t - HIT;
    const distance = Math.hypot((x - 3.35) * .65, z - 2.15);
    const envelope = elapsed > 0
      ? Math.exp(-elapsed * 2.3) : 0;
    const ripple = elapsed > 0
      ? Math.sin(elapsed * 22 - distance * 3.2) * envelope : 0;
    const punch = elapsed > 0
      ? Math.exp(-elapsed * 4) * Math.exp(-distance * 1.4) : 0;

    return [x, 26.8 + ripple * .26 + punch * .85, z];
  }

  function goalNet(t) {
    polygon([
      [-3.66, 25, 0], [-3.66, 26.8, 0],
      [3.66, 26.8, 0], [3.66, 25, 0]
    ], "rgba(2,10,12,.14)");

    const color = "rgba(193,217,216,.26)";

    for (let x = -3.66; x <= 3.67; x += .305) {
      const points = [];
      for (let z = 0; z <= 2.45; z += .122) {
        points.push(netPoint(x, z, t));
      }
      path(points, color, .65);
      path([[x, 25, 2.44], netPoint(x, 2.44, t)],
        "rgba(193,217,216,.2)", .65);
    }

    for (let z = 0; z <= 2.45; z += .2033) {
      const points = [];
      for (let x = -3.66; x <= 3.67; x += .183) {
        points.push(netPoint(x, z, t));
      }
      path(points, color, .65);

      for (const side of [-3.66, 3.66]) {
        path([[side, 25, z], netPoint(side, z, t)], color, .65);
      }
    }

    for (const side of [-3.66, 3.66]) {
      for (let y = 25; y < 26.81; y += .3) {
        path([[side, y, 0], [side, y, 2.44]], color, .65);
      }
    }
  }

  function goalFrame() {
    const points = [
      [-3.66, 25, 0], [-3.66, 25, 2.44],
      [3.66, 25, 2.44], [3.66, 25, 0]
    ];

    ctx.lineJoin = "round";
    path(points, "#597773", Math.max(3, height * .006));
    path(points, "#d7e8df", Math.max(1.7, height * .0032));
    path([[-3.66, 25, 2.44], [-3.66, 26.8, 2.44]],
      "#92aaa3", 1.3);
    path([[3.66, 25, 2.44], [3.66, 26.8, 2.44]],
      "#92aaa3", 1.3);
  }

  function segment(ax, ay, bx, by, thickness, color) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function player(actor, t) {
    const p = project(actor.x, actor.y, actor.z || 0);
    const ground = project(actor.x, actor.y, 0);
    const phase = t * (actor.speed || 9) + (actor.phase || 0);
    const stride = Math.sin(phase) * (actor.run ?? 1);
    const s = p.s;
    const keeper = actor.keeper;
    const dive = keeper ? ease((t - KICK - .06) / .65) : 0;
    const landing = keeper ? ease((t - HIT - .35) / .9) : 0;

    ctx.save();
    ctx.translate(ground.x, ground.y + 2);
    ctx.scale(1, .25);
    ctx.fillStyle = "rgba(0,5,7,.35)";
    ctx.beginPath();
    ctx.ellipse(0, 0, s * .53, s * .22, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(keeper ? dive * 1.13 + landing * .35 : actor.tilt || 0);
    ctx.scale(s, s);

    const skin = actor.skin || "#855744";
    const shirt = keeper ? "#d8e78a" : actor.team === "away"
      ? "#a5c3cb" : "#ee523c";
    const shorts = keeper ? "#8eaa57" : actor.team === "away"
      ? "#273d4a" : "#251d23";

    for (const side of [-1, 1]) {
      const step = stride * side;
      const hipX = side * .135;
      const kneeX = side * .18 + step * .12;
      const kneeY = -.47 + Math.max(0, step) * .12;
      const footX = side * .19 - step * .16;
      const footY = -.025 - Math.max(0, -step) * .28;

      segment(hipX, -.88, kneeX, kneeY, .19, shorts);
      segment(kneeX, kneeY, footX, footY - .12, .12, skin);
      segment(
        mix(kneeX, footX, .45), mix(kneeY, footY - .12, .45),
        footX, footY - .08, .125,
        keeper ? "#d0df87" : actor.team === "away" ? "#9cb8c1" : "#d44032"
      );
      segment(footX, footY - .045, footX + .15, footY,
        .105, actor.team === "away" ? "#e0d5a8" : "#dbe9dc");
    }

    const jersey = ctx.createLinearGradient(-.35, 0, .35, 0);
    jersey.addColorStop(0, shorts);
    jersey.addColorStop(.38, shirt);
    jersey.addColorStop(1, shirt);

    ctx.beginPath();
    ctx.moveTo(-.29, -1.43);
    ctx.quadraticCurveTo(0, -1.51, .29, -1.43);
    ctx.lineTo(.235, -.89);
    ctx.quadraticCurveTo(0, -.8, -.235, -.89);
    ctx.closePath();
    ctx.fillStyle = jersey;
    ctx.fill();

    segment(-.21, -1.34, -.17, -.97, .022, "rgba(255,255,255,.22)");
    segment(.19, -1.32, .16, -.98, .018, "rgba(0,0,0,.2)");

    for (const side of [-1, 1]) {
      const elbowX = side * (.38 + dive * .035);
      const elbowY = keeper
        ? mix(-1.05, -1.82, dive)
        : -1.12 + stride * side * .14;
      const handX = keeper
        ? side * mix(.48, .25, dive)
        : side * .3 + stride * .13;
      const handY = keeper
        ? mix(-1.25, side === 1 ? -2.42 : -2.2, dive)
        : -1.33 + stride * side * .15;

      segment(side * .27, -1.37, elbowX, elbowY, .16, shirt);
      segment(elbowX, elbowY, handX, handY, .105, skin);
      segment(handX, handY, handX + .015, handY - .07,
        keeper ? .15 : .095, keeper ? "#edf3db" : skin);
    }

    segment(0, -1.43, 0, -1.56, .14, skin);

    ctx.beginPath();
    ctx.ellipse(0, -1.66, .14, .175, -.08, 0, TAU);
    ctx.fillStyle = skin;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-.013, -1.73, .143, .105, -.08, Math.PI, TAU);
    ctx.fillStyle = "#171b1c";
    ctx.fill();

    ctx.restore();
  }

  const attackKeys = [
    [0, -2.7, 5.3],
    [.95, -2.3, 6.5],
    [2, -2.1, 8.2],
    [2.65, .3, 9.4],
    [KICK, .7, 12.7],
    [5.7, 1.15, 15],
    [DURATION, 1.6, 16]
  ];

  function attacker(t) {
    for (let i = 1; i < attackKeys.length; i++) {
      const a = attackKeys[i - 1];
      const b = attackKeys[i];
      if (t <= b[0]) {
        const u = ease((t - a[0]) / (b[0] - a[0]));
        return { x: mix(a[1], b[1], u), y: mix(a[2], b[2], u) };
      }
    }
    return { x: 1.6, y: 16 };
  }

  function ballPosition(t) {
    if (t < .95) {
      const u = clamp(t / .95);
      return {
        x: mix(3.4, -2, u),
        y: mix(2.5, 6.8, u),
        z: .12 + Math.sin(u * Math.PI) * .25
      };
    }

    if (t < KICK) {
      const a = attacker(t);
      return {
        x: a.x + .3 + Math.sin(t * 11) * .08,
        y: a.y + .3 + Math.abs(Math.sin(t * 8)) * .16,
        z: .12 + Math.abs(Math.sin(t * 11)) * .09
      };
    }

    if (t <= HIT) {
      const u = clamp((t - KICK) / (HIT - KICK));
      return {
        x: mix(1, 3.4, u) + Math.sin(u * Math.PI) * .48,
        y: mix(13, 26.8, u),
        z: mix(.16, 2.15, u) + Math.sin(u * Math.PI) * .52
      };
    }

    const elapsed = t - HIT;
    const fall = Math.max(0, elapsed - .16);
    const firstFall = 2.15 - 4.5 * fall * fall;
    const bounceTime = Math.max(0, fall - Math.sqrt(2.03 / 4.5));

    return {
      x: 3.4 - Math.min(elapsed * .28, .75),
      y: 26.8 + Math.sin(elapsed * 13) * .3 * Math.exp(-elapsed * 3),
      z: firstFall > .12
        ? firstFall
        : .12 + Math.abs(Math.sin(bounceTime * 9)) *
          .34 * Math.exp(-bounceTime * 2.8)
    };
  }

  function ballTrail(t) {
    if (t < KICK || t > HIT + .09) return;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 15; i > 0; i--) {
      const past = Math.max(KICK, Math.min(t, HIT) - i * .006);
      const next = Math.max(KICK, past + .008);
      const a = ballPosition(past);
      const b = ballPosition(Math.min(next, HIT));
      const p = project(a.x, a.y, a.z);
      const q = project(b.x, b.y, b.z);
      const alpha = (1 - i / 16) * .34;

      segment(p.x, p.y, q.x, q.y,
        Math.max(1, p.s * .12 * (1 - i / 20)),
        `rgba(202,239,203,${alpha})`);
    }

    ctx.restore();
  }

  function drawBall(ball, t) {
    const p = project(ball.x, ball.y, ball.z);
    const ground = project(ball.x, ball.y, 0);
    const radius = Math.max(2.3, p.s * .11);

    ctx.fillStyle = `rgba(0,0,0,${.25 / (1 + ball.z)})`;
    ctx.beginPath();
    ctx.ellipse(ground.x, ground.y, radius * 1.3, radius * .4, 0, 0, TAU);
    ctx.fill();

    if (t > KICK && t < HIT + .1) {
      glow(ctx, p.x, p.y, radius * 5, "rgba(213,241,190,.2)");
    }

    const shading = ctx.createRadialGradient(
      p.x - radius * .35, p.y - radius * .4, 0, p.x, p.y, radius
    );
    shading.addColorStop(0, "#ffffff");
    shading.addColorStop(.55, "#dce3d9");
    shading.addColorStop(1, "#718c89");

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, TAU);
    ctx.fillStyle = shading;
    ctx.fill();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(t * 24);
    ctx.beginPath();

    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU;
      const x = Math.cos(a) * radius * .43;
      const y = Math.sin(a) * radius * .43;
      if (!i) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = "#233339";
    ctx.fill();
    ctx.restore();
  }

  function atmosphere(t) {
    const rand = random(231);

    for (let i = 0; i < 85; i++) {
      const x = (rand() * width + t * (3 + rand() * 6)) % width;
      const y = (rand() * height + Math.sin(t * .5 + i) * 9) % height;
      const radius = .3 + rand() * 1.1;

      ctx.fillStyle = `rgba(194,221,209,${.04 + rand() * .15})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    }

    const kickAge = t - KICK;
    if (kickAge > 0 && kickAge < 1.2) {
      const debris = random(816);

      for (let i = 0; i < 30; i++) {
        const vx = (debris() - .5) * 3;
        const vy = debris() * 3;
        const vz = .6 + debris() * 2;
        const z = vz * kickAge - 3.6 * kickAge * kickAge;
        if (z < 0) continue;

        const p = project(1 + vx * kickAge, 13 + vy * kickAge, z);
        ctx.fillStyle = `rgba(133,163,83,${1 - kickAge / 1.2})`;
        ctx.fillRect(p.x, p.y, 1.5, 3);
      }
    }

    const impactAge = t - HIT;
    if (impactAge > 0 && impactAge < 2.5) {
      const power = Math.exp(-impactAge * 3);
      const goal = project(3.4, 26.8, 2.15);

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      glow(ctx, goal.x, goal.y, height * .27,
        `rgba(216,242,202,${power * .25})`);

      for (let i = 0; i < 32; i++) {
        const a = rand() * TAU;
        const r = impactAge * (12 + rand() * 70);
        const x = goal.x + Math.cos(a) * r;
        const y = goal.y + Math.sin(a) * r + impactAge * impactAge * 12;

        ctx.fillStyle = `rgba(220,240,223,${power * .65})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }

      ctx.fillStyle = `rgba(201,231,219,${power * .075})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    if (t > HIT + .15) {
      const crowd = random(789);
      for (let i = 0; i < 24; i++) {
        const x = width * .43 + crowd() * width * .57;
        const y = height * (.2 + crowd() * .24);
        const pulse = Math.pow(Math.max(0,
          Math.sin(t * (5 + crowd() * 4) + i * 2.6)), 24);

        if (pulse > .1) {
          glow(ctx, x, y, 10, `rgba(209,236,249,${pulse * .7})`);
        }
      }
    }
  }

  function render(t) {
    const shotFocus = ease((t - 3.3) / 1.4);
    const hitShake = t > HIT
      ? Math.sin((t - HIT) * 55) * Math.exp(-(t - HIT) * 9) : 0;

    camera.zoom = 1 + shotFocus * .045;
    camera.x = Math.sin(t * .45) * height * .006 + hitShake * 1.6;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(stadium, 0, 0, width, height);

    pitch();
    goalNet(t);

    const lead = attacker(t);
    const dive = ease((t - KICK - .06) / .65);
    const land = ease((t - HIT - .35) / .9);
    const evade = ease((t - 2.05) / .65);
    const ball = ballPosition(t);

    const actors = [
      {
        x: -4.5 + t * .12,
        y: Math.min(17, 7 + t * 1.3),
        phase: 2,
        team: "home",
        skin: "#654536"
      },
      {
        x: 4.9 - t * .1,
        y: Math.min(20, 5 + t * 1.8),
        phase: 4,
        team: "home",
        skin: "#a47353"
      },
      {
        x: -1.15 - evade * 1.2,
        y: 10.7 - evade * .55 + Math.max(0, t - 3.2) * .5,
        tilt: -.23 * evade,
        team: "away",
        phase: 1.1,
        run: .55,
        skin: "#aa7b61"
      },
      {
        x: 3.2 - ease(t / 5) * .9,
        y: 17 - ease(t / 4) * 1.4,
        team: "away",
        phase: 3,
        run: .6
      },
      {
        ...lead,
        team: "home",
        phase: .2,
        run: t > KICK ? .45 : 1,
        tilt: t > 2 && t < 2.7 ? -.13 : .035,
        skin: "#77513e"
      },
      {
        x: .05 + dive * .72,
        y: 24.65,
        z: dive * .72 * (1 - land),
        keeper: true,
        run: .12 + dive * .3,
        phase: 1,
        skin: "#a47b61"
      },
      { ...ball, isBall: true }
    ];

    ballTrail(t);
    actors.sort((a, b) => b.y - a.y);
    for (const actor of actors) {
      if (actor.isBall) drawBall(actor, t);
      else player(actor, t);
    }

    goalFrame();
    atmosphere(t);

    const haze = ctx.createLinearGradient(0, height * .35, 0, height * .64);
    haze.addColorStop(0, "rgba(162,201,200,0)");
    haze.addColorStop(.45, "rgba(162,201,200,.075)");
    haze.addColorStop(1, "rgba(162,201,200,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, height * .35, width, height * .3);

    const vignette = ctx.createRadialGradient(
      width * .76, height * .5, height * .16,
      width * .7, height * .5, sceneWidth * .75
    );
    vignette.addColorStop(0, "rgba(1,5,9,0)");
    vignette.addColorStop(1, "rgba(1,5,9,.72)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    const fade = Math.max(
      1 - ease(t / .6),
      ease((t - (DURATION - .7)) / .7)
    );
    ctx.fillStyle = `rgba(3,8,12,${fade})`;
    ctx.fillRect(0, 0, width, height);
  }

  function resize() {
    const hero = document.querySelector(".hero");
    width = hero.clientWidth;
    height = hero.clientHeight;
    sceneWidth = Math.max(width, height * 1.35);
    dpr = Math.min(devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    buildStadium();
    render(reducedMotion.matches ? HIT + .09 : time);
  }

  function tick(timestamp) {
    const delta = previous ? Math.min((timestamp - previous) / 1000, .05) : 0;
    previous = timestamp;
    time = (time + delta) % DURATION;
    render(time);
    frameId = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    cancelAnimationFrame(frameId);
    previous = 0;

    if (reducedMotion.matches) {
      render(HIT + .09);
    } else if (!document.hidden) {
      frameId = requestAnimationFrame(tick);
    }
  }

  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncPlayback);
  reducedMotion.addEventListener("change", syncPlayback);

  resize();
  syncPlayback();
})();