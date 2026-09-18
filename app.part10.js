      const x = (Math.sin(i * 12.37 + 0.4) * 0.5 + 0.5) * w;
      const y = (Math.cos(i * 7.19 + 1.1) * 0.5 + 0.5) * h;
      const a = 0.008 + (i % 5) * 0.003;
      g.fillStyle = `rgba(170,190,255,${a})`;
      g.beginPath();
      g.arc(x, y, i % 11 === 0 ? 0.85 : 0.4, 0, Math.PI * 2);
      g.fill();
    }

    const transport = state.playing ? transportTime() : pauseAccum;
    const mode = state.visualMode;
    if (mode === "pendulum") drawPendulum(g, w, h, transport);
    else if (mode === "circular") drawCircular(g, w, h, transport);
    else if (mode === "linear") drawLinear(g, w, h, transport);
    else if (mode === "mandala") drawMandala(g, w, h, transport);
    else if (mode === "triangles") drawTriangles(g, w, h, transport);
    else if (mode === "waves") drawWaves(g, w, h, transport);
    else if (mode === "sineRibbons") drawSineRibbons(g, w, h, transport);
    else drawPendulum(g, w, h, transport);

    // decay flashes
    state.voices.forEach((v) => { v._flash = Math.max(0, (v._flash || 0) - 0.028); }); // soft brightness pulse decay

    $("#badgeTime").textContent = formatTime(transport);
    $("#badgeMode").textContent = state.visualMode;
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function drawPendulum(g, w, h, t) {
    // Space Pendulum: single top-center pivot, fan of thin strings + soft glowing bobs
    const n = Math.max(1, state.voices.length);
    const cx = w * 0.5;
    const originY = h * 0.11;
    const maxLen = h * 0.78;
    const periods = state.voices.map(voicePeriodSec);
    const maxP = Math.max(...periods, 0.01);
    const minP = Math.min(...periods, maxP);

    // Faint guide cross (very subtle, Lucid-style)
    g.strokeStyle = "rgba(120,150,200,0.06)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(w * 0.12, originY);
    g.lineTo(w * 0.88, originY);
    g.moveTo(cx, originY);
    g.lineTo(cx, h * 0.92);
    g.stroke();

    // Soft additive glow layer for bobs
    g.globalCompositeOperation = "lighter";

    state.voices.forEach((v, i) => {
      const s = effectiveSimplicity(v);
      const period = voicePeriodSec(v);
      let len;
      if (state.quadraticLength) {
        const tNorm = (period * period) / (maxP * maxP);
        const tMin = (minP * minP) / (maxP * maxP);
        const span = Math.max(0.05, 1 - tMin);
        len = maxLen * (0.32 + 0.68 * ((tNorm - tMin) / span));
      } else {
        // Longer = slower (fewer beats in cycle), classic pendulum wave
        const rank = (n <= 1) ? 0.5 : i / (n - 1);
        len = maxLen * (0.38 + 0.58 * rank);
        // Prefer period mapping when available
        len = maxLen * (0.36 + 0.6 * (period / (period + 2.2)));
      }
      // Fan spread: rest angle fans outward from center
      const fan = ((i + 0.5) / n - 0.5) * (Math.PI * 0.42);
      const amp = (0.42 + (1 - s) * 0.28) * (Math.PI / 3.2);
      const ang = fan + pendulumAngle(v, t) * amp;
      const x1 = cx + Math.sin(ang) * len;
      const y1 = originY + Math.cos(ang) * len;
      const flash = Math.min(v._flash || 0, 0.5); // cap hit flash bloom

      // Thin string (drawn in source-over briefly for faint line)
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "rgba(160,180,220,0.22)";
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(cx, originY);
      g.lineTo(x1, y1);
      g.stroke();

      // Soft bloom orb (additive) — color glow only, no white cores
      g.globalCompositeOperation = "lighter";
      const r = 6 + (1 - s) * 4 + flash * 5;
      const bloom = Math.min(r * (2.5 + flash * 0.8), r * 3.0);
      const grd = g.createRadialGradient(x1, y1, 0, x1, y1, bloom);
      grd.addColorStop(0, hexAlpha(v.color, 0.55 + flash * 0.25));
      grd.addColorStop(0.22, hexAlpha(v.color, 0.32 + flash * 0.18));
      grd.addColorStop(0.55, hexAlpha(v.color, 0.12 + flash * 0.1));
