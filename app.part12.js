        const flash = (v._flash || 0) > 0.2 && Math.abs(((t / period) % 1) - b / beats) < 0.04;
        g.fillStyle = hexAlpha(v.color, flash ? 1 : 0.55);
        g.beginPath();
        g.arc(x, y, flash ? 7 : 4, 0, Math.PI * 2);
        g.fill();
      }

      // playhead
      const ph = (t % windowSec) / windowSec;
      g.strokeStyle = "rgba(255,255,255,0.35)";
      g.beginPath();
      g.moveTo(left + ph * span, y - rowH * 0.35);
      g.lineTo(left + ph * span, y + rowH * 0.35);
      g.stroke();
    });
  }


  function drawMandala(g, w, h, t) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.44;
    const n = state.voices.length || 1;
    state.voices.forEach((v, i) => {
      const s = effectiveSimplicity(v);
      const period = voicePeriodSec(v);
      const ring = maxR * ((i + 1) / (n + 0.35));
      const petals = 5 + Math.round((1 - s) * 5) + (i % 3);
      const rot = ((t / period) % 1) * Math.PI * 2 + (v.phase || 0) * Math.PI * 2;
      g.strokeStyle = hexAlpha(v.color, 0.22 + (v._flash || 0) * 0.35);
      g.lineWidth = 1.2 + (v._flash || 0) * 1.5;
      g.beginPath();
      for (let p = 0; p <= petals * 2; p++) {
        const a = rot + (p / (petals * 2)) * Math.PI * 2;
        const r = p % 2 === 0 ? ring : ring * (0.55 + s * 0.15);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (p === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.stroke();
      // arc petals
      for (let p = 0; p < petals; p++) {
        const a0 = rot + (p / petals) * Math.PI * 2;
        const a1 = a0 + Math.PI / petals;
        g.strokeStyle = hexAlpha(v.color, 0.35);
        g.beginPath();
        g.arc(cx, cy, ring * 0.92, a0, a1);
        g.stroke();
      }
      const beadA = rot - Math.PI / 2;
      const bx = cx + Math.cos(beadA) * ring;
      const by = cy + Math.sin(beadA) * ring;
      const rad = 4 + (v._flash || 0) * 8;
      g.fillStyle = hexAlpha(v.color, 0.9);
      g.beginPath();
      g.arc(bx, by, rad, 0, Math.PI * 2);
      g.fill();
    });
  }

  // ----- Nested Triangles (mode "triangles") -----
  // Large outer triangle with concentric similar insets at a fixed interval.
  // Each voice (tri-0…tri-6) stairs through nest levels in→out→in.
  // Tone ONLY at the outer edge: onGateSideSample(v, +1); inside latches -1.
  // Machine-scoped outer flash — not a Gate page-wide stroke.
  const TRI_NEST_DEFAULT = 9; // readable lattice of nested triangles
  const triHits = [];
  let triFxStamp = 0;
  let triStructFlash = 0;

  function triangleMachineLive() {
    return state.visualMode === "triangles" && state.voices.some((v) => /^tri-\d+$/.test(String(v.pathId || "")));
  }

  function ensureTriangleMachine() {
    if (state.visualMode !== "triangles") return;
    if (triangleMachineLive()) return;
    if (typeof installTriangleVoices === "function") {
      installTriangleVoices();
      if (!state.activePreset) state.activePreset = "Nested Triangles";
      return;
    }
    if (typeof applyPreset === "function") applyPreset("Nested Triangles");
  }

  function syncTriangleChrome() {
    const tri = state.visualMode === "triangles";
    document.body.classList.toggle("mode-triangles", tri);
    if (tri) {
      const gate = document.getElementById("dialRow");
      const circ = document.getElementById("circularDials");
      const looks = document.getElementById("gateLooks");
      const cube = document.getElementById("cubeDials");
      if (gate) gate.hidden = true;
      if (circ) circ.hidden = true;
      if (looks) looks.hidden = true;
      if (cube) cube.hidden = true;
    }
  }

  function triVerts(cx, cy, R) {
    // Equilateral, point-up. R = circumradius.
    const out = [];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      out.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }
    return out;
  }

  function drawTriPath(g, verts) {
    g.beginPath();
    g.moveTo(verts[0][0], verts[0][1]);
    g.lineTo(verts[1][0], verts[1][1]);
    g.lineTo(verts[2][0], verts[2][1]);
    g.closePath();
  }

  // level 0 = innermost, level depth-1 = outermost (Audio: tri-0 inner → tri-6 outer).
  function triNestRadius(level, depth, outerR) {
    if (depth <= 1) return outerR;
    const t = (level + 1) / depth; // equal radial interval
    return outerR * (0.12 + t * 0.88);
  }

  function tickTriFx(dt) {
    triStructFlash = Math.max(0, triStructFlash - dt * 2.2);
    for (let i = triHits.length - 1; i >= 0; i--) {
      triHits[i].life -= dt;
      if (triHits[i].life <= 0) triHits.splice(i, 1);
    }
  }

  function spawnTriOuterHit(color, verts) {
    triStructFlash = 1;
    triHits.push({
      life: 0.58,
      max: 0.58,
      color: color,
      verts: verts.map((p) => [p[0], p[1]]),
    });
    if (triHits.length > 14) triHits.shift();
  }

  function triStep(v, t, depth) {
    const period = Math.max(0.12, voicePeriodSec(v));
    const p = ((t / period + (v.phase || 0)) % 1 + 1) % 1;
    // Triangle wave 0→1→0: 0 = inner, 1 = outer apex.
    const tri = p < 0.5 ? p * 2 : 2 - p * 2;
    const maxL = Math.max(1, depth - 1);
    const level = Math.round(tri * maxL); // 0..depth-1
    const along = tri; // continuous 0..1 for bead placement
    return { period, p, tri, level, along, atOuter: level === maxL };
  }

  function drawTriangles(g, w, h, t, sampleOnly) {
    ensureTriangleMachine();
    const nowMs = performance.now();
    const dt = triFxStamp ? Math.min(0.05, (nowMs - triFxStamp) / 1000) : 0.016;
    triFxStamp = nowMs;
    tickTriFx(dt);

    // Prefer Audio pathIds tri-0…tri-6 (inner → outer).
    const steps = [];
    const seen = Object.create(null);
    for (let i = 0; i < state.voices.length; i++) {
      const v = state.voices[i];
      const id = String(v.pathId || "");
      if (!/^tri-\d+$/.test(id)) continue;
      if (seen[id]) continue;
      seen[id] = true;
      steps.push(v);
    }
    steps.sort((a, b) => {
      const ai = Number(String(a.pathId).slice(4));
      const bi = Number(String(b.pathId).slice(4));
      return ai - bi;
    });
    if (!steps.length) {
      for (let i = 0; i < state.voices.length; i++) {
        const v = state.voices[i];
        if (v.mute) continue;
        steps.push(v);
      }
    }

    const depth = Math.max(TRI_NEST_DEFAULT, steps.length + 2);
    const cx = w * 0.5;
    const cy = h * 0.56;
    const outerR = Math.min(w, h) * 0.42;
    const outerVerts = triVerts(cx, cy, outerR);

    // Per-voice stair through nest levels; sample before paint.
    const travelers = [];
    for (let i = 0; i < steps.length; i++) {
      const v = steps[i];
      const st = triStep(v, t, depth);
      const R = triNestRadius(st.level, depth, outerR);
      const verts = triVerts(cx, cy, R);
      // Bead sits on the top vertex of the active nest triangle.
      const bx = verts[0][0];
      const by = verts[0][1];
      v._orbPhase = st.along;
      v._orbX = bx;
      v._orbY = by;
      // Convention: +1 at outer edge only; -1 while inside (latch, silent).
      const side = st.atOuter ? 1 : -1;
      v._gateSide = side;
      if (typeof publishPitchHint === "function") publishPitchHint(v);
      let hit = false;
      if (typeof onGateSideSample === "function" && onGateSideSample(v, side)) {
        hit = true;
        v._flashX = bx;
        v._flashY = by;
        spawnTriOuterHit(v.color, outerVerts);
      }
      travelers.push({ v, st, verts, bx, by, hit, R });
    }

    if (sampleOnly) return;

    // Soft nest fill — faint crystal lattice, no Gate line.
    g.save();
    g.globalCompositeOperation = "source-over";
    const struct = triStructFlash;
    for (let level = depth - 1; level >= 0; level--) {
      const R = triNestRadius(level, depth, outerR);
      const verts = triVerts(cx, cy, R);
      const isOuter = level === depth - 1;
      drawTriPath(g, verts);
      g.fillStyle = isOuter
        ? "rgba(120,170,230," + (0.045 + struct * 0.07) + ")"
        : "rgba(90,130,200," + (0.018 + (level / depth) * 0.012) + ")";
      g.fill();
      g.strokeStyle = isOuter
        ? "rgba(210,235,255," + (0.42 + struct * 0.45) + ")"
        : "rgba(150,190,240," + (0.14 + (level / depth) * 0.1) + ")";
      g.lineWidth = isOuter ? 2.1 + struct * 1.4 : 1.05;
      g.stroke();
    }

    // Sequential pulse highlights — active nest ring per voice.
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < travelers.length; i++) {
      const { v, st, verts, bx, by } = travelers[i];
      const flash = Math.min(v._flash || 0, 1);
      const pulse = 0.22 + (1 - Math.abs(st.along - 0.5) * 1.4) * 0.18 + flash * 0.35;
      drawTriPath(g, verts);
      g.strokeStyle = hexAlpha(v.color, Math.max(0.12, Math.min(0.85, pulse)));
      g.lineWidth = 1.4 + flash * 2.2;
      g.stroke();
      // Soft fill on the stepped triangle
      drawTriPath(g, verts);
      g.fillStyle = hexAlpha(v.color, 0.04 + flash * 0.12);
      g.fill();
      // Traveler bead
      const rad = 3.2 + flash * 5.5;
      const bloom = rad * (2.4 + flash * 1.2);
      const grd = g.createRadialGradient(bx, by, 0, bx, by, bloom);
      grd.addColorStop(0, hexAlpha(v.color, 0.55 + flash * 0.35));
      grd.addColorStop(0.4, hexAlpha(v.color, 0.18 + flash * 0.15));
      grd.addColorStop(1, hexAlpha(v.color, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(bx, by, bloom, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = hexAlpha(v.color, 0.9);
      g.beginPath();
      g.arc(bx, by, rad * 0.45, 0, Math.PI * 2);
      g.fill();
    }

    // Outer-edge hit flashes — machine-scoped along the large triangle only.
    for (let i = 0; i < triHits.length; i++) {
      const h = triHits[i];
      const u = Math.max(0, h.life / h.max);
      drawTriPath(g, h.verts);
      g.strokeStyle = hexAlpha(h.color, 0.15 + u * 0.75);
      g.lineWidth = 2 + u * 5;
      g.stroke();
      // Corner sparks
      for (let k = 0; k < 3; k++) {
        const px = h.verts[k][0];
        const py = h.verts[k][1];
        const br = 10 + u * 28;
        const sg = g.createRadialGradient(px, py, 0, px, py, br);
        sg.addColorStop(0, hexAlpha(h.color, 0.55 * u));
        sg.addColorStop(1, hexAlpha(h.color, 0));
        g.fillStyle = sg;
        g.beginPath();
        g.arc(px, py, br, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  function drawWaves(g, w, h, t) {
    // Hammer Waves — stacked horizontal sine / hammer wave bars
    const n = state.voices.length || 1;
    const top = 24;
    const bottom = h - 24;
    const rowH = (bottom - top) / n;
    const left = 48;
    const right = w - 24;
    const span = right - left;
    state.voices.forEach((v, i) => {
      const y0 = top + rowH * (i + 0.5);
      const s = effectiveSimplicity(v);
      const period = voicePeriodSec(v);
