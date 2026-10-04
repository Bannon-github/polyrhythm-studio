      grd.addColorStop(1, hexAlpha(v.color, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x1, y1, bloom, 0, Math.PI * 2);
      g.fill();

      // Core bob — soft color fill or ring (no bright white)
      if (i % 3 === 1) {
        g.strokeStyle = hexAlpha(v.color, 0.5 + flash * 0.25);
        g.lineWidth = 1.4 + flash * 0.6;
        g.beginPath();
        g.arc(x1, y1, r * 0.85, 0, Math.PI * 2);
        g.stroke();
      } else {
        g.fillStyle = hexAlpha(v.color, 0.7 + flash * 0.15);
        g.beginPath();
        g.arc(x1, y1, r * 0.5, 0, Math.PI * 2);
        g.fill();
      }
    });

    g.globalCompositeOperation = "source-over";
    // Pivot ring
    g.strokeStyle = "rgba(220,235,255,0.45)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(cx, originY, 5, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(220,235,255,0.2)";
    g.beginPath();
    g.arc(cx, originY, 2.2, 0, Math.PI * 2);
    g.fill();
  }

  // ----- Circular Rhythm machine (mode "circular") -----
  // Canvas-only layer. Audio owns notes / pathIds / period via installCircularVoices.
  // Index 0 = innermost / highest. Period grows with ring index. Phase 0. Tone via onGateSideSample.
  const CIRC_RING_MIN = 1;
  const CIRC_RING_MAX = 8;
  let circFxStamp = 0;
  const circParts = [];
  const circReverbs = [];
  let circMirror = null;

  function circSharedPeriod() {
    if (typeof circularRhythmPeriod === "function") return circularRhythmPeriod();
    return 240 / Math.max(20, state.bpm || 48);
  }

  function circRingCount() {
    const cr = state.circularRhythm;
    const n = (cr && cr.ringCount) || state.circularRings || state.voices.length || 8;
    return Math.max(CIRC_RING_MIN, Math.min(CIRC_RING_MAX, n | 0));
  }

  function circVoiceAtRing(i) {
    const id = "ring-" + i;
    for (let k = 0; k < state.voices.length; k++) {
      if (state.voices[k].pathId === id) return state.voices[k];
    }
    return state.voices[i] || null;
  }

  function ensureCircularMachine() {
    if (state.visualMode !== "circular") return;
    state.circularRings = circRingCount();
    // Prefer Audio's live machine. If voices already carry ring-0..N, do not reinstall.
    const n = circRingCount();
    let ok = state.voices.length >= n;
    if (ok) {
      for (let i = 0; i < n; i++) {
        if (!circVoiceAtRing(i)) { ok = false; break; }
      }
    }
    if (ok) return;
    if (typeof installCircularVoices === "function") {
      const prog = (state.circularRhythm && state.circularRhythm.progression)
        || (typeof CIRC_PROGRESSIONS !== "undefined" ? CIRC_PROGRESSIONS[state.circularChord | 0] : "C")
        || "C";
      const idx = (state.circularRhythm && state.circularRhythm.chordIndex) || 0;
      installCircularVoices(prog, idx, n);
      if (!state.activePreset) state.activePreset = "Circular Rhythm";
      return;
    }
    if (typeof applyPreset === "function" && state.activePreset !== "Circular Rhythm") {
      applyPreset("Circular Rhythm");
    }
  }

  function circRgb(color) {
    return (typeof gateRgb === "function") ? gateRgb(color) : [186, 214, 255];
  }

  function drawCircSpark(g, x, y, size, alpha, rgb) {
    const a = Math.max(0, Math.min(1, alpha));
    if (a < 0.02) return;
    const col = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",";
    g.fillStyle = col + (a * 0.95) + ")";
    g.beginPath();
    g.arc(x, y, Math.max(0.35, size * 0.28), 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = col + (a * 0.85) + ")";
    g.lineWidth = Math.max(0.5, size * 0.18);
    const s = size;
    g.beginPath();
    g.moveTo(x - s, y);
    g.lineTo(x + s, y);
    g.moveTo(x, y - s * 1.25);
    g.lineTo(x, y + s * 1.25);
    g.stroke();
  }

  function spawnCircHit(x, y, v, cy) {
    const rgb = circRgb(v.color);
    const n = 18 + Math.round((1 - (v._pitch01 || 0.5)) * 8);
    for (let i = 0; i < n && circParts.length < 220; i++) {
      const ang = (i / n) * Math.PI * 2 + (v.id || 0) * 0.17;
      const sp = 28 + (i % 5) * 18 + (v._pitch01 || 0.5) * 36;
      circParts.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp * 0.72,
        life: 0.45 + (i % 4) * 0.06,
        max: 0.55,
        r: 1.1 + (i % 3) * 0.7,
        rgb,
        reflect: false,
      });
    }
    // Reflection of the hit, drifting under the contact, still behind the rings.
    for (let i = 0; i < 8 && circParts.length < 220; i++) {
      circParts.push({
        x: x + (i - 4) * 3.2,
        y: y + (y - cy) * 0.15 + 10,
        vx: (i - 3.5) * 8,
        vy: 18 + i * 4,
        life: 0.55,
        max: 0.55,
        r: 1.4,
        rgb,
        reflect: true,
      });
    }
  }

  function tickCircFx(dt) {
    for (let i = circParts.length - 1; i >= 0; i--) {
      const o = circParts[i];
      o.life -= dt;
      if (o.life <= 0) { circParts.splice(i, 1); continue; }
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vx *= 1 - Math.min(0.45, dt * 1.6);
      o.vy *= 1 - Math.min(0.45, dt * 1.4);
    }
  }

  function drawCircParticulate(g) {
    for (let i = 0; i < circParts.length; i++) {
      const o = circParts[i];
      const u = 1 - o.life / o.max;
      const a = (1 - u) * (1 - u) * (o.reflect ? 0.45 : 0.9);
      drawCircSpark(g, o.x, o.y, o.r * (1.4 - u * 0.5), a, o.rgb);
    }
  }

  const circAmbient = [];
  function ensureCircAmbient() {
    if (circAmbient.length) return;
    for (let i = 0; i < 64; i++) {
      circAmbient.push({
        a: (i * 0.97) % (Math.PI * 2),
        rad: 0.12 + ((i * 37) % 100) / 100 * 0.92,
        ph: (i * 1.7) % (Math.PI * 2),
        sp: 0.2 + (i % 7) * 0.08,
        s: 0.7 + (i % 5) * 0.35,
      });
    }
  }

  // Sparkles and a soft reflection sit behind the rings. No stroke across the page.
  function drawCircBehind(g, cx, cy, maxR, t, pts, lineOn) {
    ensureCircAmbient();
    g.save();
    const wash = g.createRadialGradient(cx, cy, maxR * 0.05, cx, cy, maxR * 1.45);
    wash.addColorStop(0, "rgba(46, 78, 130, 0.22)");
    wash.addColorStop(0.5, "rgba(16, 28, 58, 0.08)");
    wash.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = wash;
    g.beginPath();
    g.arc(cx, cy, maxR * 1.5, 0, Math.PI * 2);
    g.fill();

    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < circAmbient.length; i++) {
      const s = circAmbient[i];
      const ang = s.a + t * s.sp * 0.22;
      const rr = maxR * s.rad;
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr * 0.9;
      const tw = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * (1.1 + s.sp) + s.ph));
      drawCircSpark(g, x, y, s.s * (0.55 + tw * 0.7), tw * 0.42, [176, 206, 245]);
    }

    // Reflections of the orbs, under the machine, warped a little.
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const rgb = circRgb(p.v.color);
      const rx = p.x + Math.sin(t * 1.3 + p.r * 0.2) * 2.2;
      const ry = cy + (cy - p.y) * 0.42 + maxR * 0.16;
      const grd = g.createRadialGradient(rx, ry, 0, rx, ry, 16);
      grd.addColorStop(0, "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.28)");
      grd.addColorStop(1, "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(rx, ry, 14, 4.2, Math.sin(t + i) * 0.2, 0, Math.PI * 2);
      g.fill();
      drawCircSpark(g, rx, ry - 2, 1.6, 0.35, rgb);
    }

    if (lineOn) {
      // Gate energy: sparkle in the crossing region only, not a line across the page.
      const reach = maxR * 0.96;
      for (let i = 0; i < 14; i++) {
        const u = (i / 13) * 2 - 1;
        const y = cy + u * reach;
        const jitter = Math.sin(t * 2.4 + i * 1.9) * (4 + (i % 3));
        const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 3.1 + i * 0.8));
        drawCircSpark(g, cx + jitter, y, 0.9 + tw * 1.1, tw * 0.38, [214, 230, 255]);
      }
      const glow = g.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.28);
      glow.addColorStop(0, "rgba(190, 220, 255, 0.16)");
      glow.addColorStop(1, "rgba(190, 220, 255, 0)");
      g.fillStyle = glow;
      g.beginPath();
      g.arc(cx, cy, maxR * 0.28, 0, Math.PI * 2);
      g.fill();
      drawCircParticulate(g);
    }
    g.restore();
  }

  function drawCircularScene(g, w, h, t, cx, cy, maxR, sampleOnly) {
    const n = circRingCount();
    const lineX = cx;
    const pts = [];
    const lineOn = state.circularLine !== false;

    for (let i = 0; i < n; i++) {
      const v = circVoiceAtRing(i);
      if (!v) continue;
      const r = maxR * ((i + 1) / (n + 0.35));
      // Lap time grows with radius, so one orbital speed. They start lined up.
      const period = (v.usePeriod && v.periodSec) ? v.periodSec : circSharedPeriod() * (i + 1);
      const phase01 = ((t / period) % 1 + 1) % 1;
      const ang = phase01 * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      v._orbPhase = phase01;
      v._gatePhase = 0;
      v._orbX = x;
      v._orbY = y;
      v._gateSide = Math.sign(x - lineX);
      if (typeof publishPitchHint === "function") publishPitchHint(v);
      // Line off: no strike and no hit sparkle. Remember side so re-enable does not pop.
      if (!lineOn) {
        if (v._gateSide === -1 || v._gateSide === 1) v._gateSideSeen = v._gateSide;
      } else if (onGateSideSample(v, v._gateSide)) {
        v._flashX = x;
        v._flashY = y;
        spawnCircHit(x, y, v, cy);
      }
      pts.push({ v, x, y, r });
    }

    if (sampleOnly) return pts;
    if (!lineOn) circParts.length = 0;

    drawCircBehind(g, cx, cy, maxR, t, pts, lineOn);

    g.save();
    g.globalCompositeOperation = "source-over";
    for (let i = 0; i < pts.length; i++) {
      const { v, r } = pts[i];
      g.strokeStyle = hexAlpha(v.color, 0.28 + (v._flash || 0) * 0.2);
      g.lineWidth = 1.25;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
    }

    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < pts.length; i++) {
      const { v, x, y } = pts[i];
      const flash = Math.min(v._flash || 0, 0.7);
      const p01 = typeof v._pitch01 === "number" ? v._pitch01 : 0.5;
      const rad = 3.2 + (1 - p01) * 2.4 + flash * 3.5;
      const bloom = rad * (2.6 + flash * 1.1);
      const grd = g.createRadialGradient(x, y, 0, x, y, bloom);
      grd.addColorStop(0, hexAlpha(v.color, 0.55 + flash * 0.3));
      grd.addColorStop(0.35, hexAlpha(v.color, 0.22 + flash * 0.12));
      grd.addColorStop(1, hexAlpha(v.color, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, bloom, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = hexAlpha(v.color, 0.82);
      g.beginPath();
      g.arc(x, y, rad * 0.48, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    return pts;
  }

  function drawCircular(g, w, h, t, sampleOnly) {
    ensureCircularMachine();
    const nowMs = performance.now();
    const dt = circFxStamp ? Math.min(0.05, (nowMs - circFxStamp) / 1000) : 0.016;
    circFxStamp = nowMs;
    tickCircFx(dt);

    const zoom = Math.max(0.45, Math.min(1.85, state.circularZoom || 1));
    const cx = w * 0.5;
    const cy = h * 0.42;
    const maxR = Math.min(w, h) * 0.36 * zoom;

    if (sampleOnly) {
      drawCircularScene(g, w, h, t, cx, cy, maxR, true);
      return;
    }

    g.globalCompositeOperation = "source-over";
    drawCircularScene(g, w, h, t, cx, cy, maxR, false);
  }

  function shouldFireHitVisual(v, beatIndex, s) {
    const skip = 1 + Math.floor(s * 3.2);
    return beatIndex % skip === 0;
  }

  function drawLinear(g, w, h, t) {
    const n = state.voices.length || 1;
    const rowH = (h - 40) / n;
    const left = 60;
    const right = w - 24;
    const span = right - left;

    state.voices.forEach((v, i) => {
      const y = 20 + rowH * (i + 0.5);
      const s = effectiveSimplicity(v);
      g.strokeStyle = hexAlpha(v.color, 0.25);
      g.beginPath();
      g.moveTo(left, y);
      g.lineTo(right, y);
      g.stroke();

      g.fillStyle = hexAlpha(v.color, 0.7);
      g.font = "11px ui-monospace, monospace";
      g.fillText(v.name.slice(0, 8), 8, y + 4);

      const period = voicePeriodSec(v);
      const windowSec = state.useBpm ? (60 / state.bpm) * 16 : state.masterCycleSec;
      const beats = Math.max(1, Math.round(windowSec / period));
      for (let b = 0; b <= beats; b++) {
        if (!shouldFireHitVisual(v, b, s)) continue;
        const x = left + (b / beats) * span;
