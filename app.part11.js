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

  function drawCircular(g, w, h, t) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.42;
    const n = state.voices.length;

    state.voices.forEach((v, i) => {
      const s = effectiveSimplicity(v);
      const r = maxR * ((i + 1) / (n + 0.5));
      g.strokeStyle = hexAlpha(v.color, 0.2);
      g.lineWidth = 1;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();

      const period = voicePeriodSec(v);
      const ang = ((t / period) % 1) * Math.PI * 2 - Math.PI / 2;
      // Show multiple beads when complex (low simplicity); few when simple
      const beads = 1 + Math.round((1 - s) * 3);
      for (let b = 0; b < beads; b++) {
        const a = ang + (b / beads) * Math.PI * 2;
        // Only draw bead if that subdivision would fire under simplicity gate
        const beatApprox = Math.floor(t / period) * beads + b;
        const gate = shouldFireHitVisual(v, beatApprox, s);
        if (!gate && b > 0) continue;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const flash = Math.min(v._flash || 0, 0.5);
        const rad = 4.5 + flash * 4 * (b === 0 ? 1 : 0.5);
        const prev = g.globalCompositeOperation;
        g.globalCompositeOperation = "lighter";
        const bloomR = Math.min(rad * (2.4 + flash * 0.9), rad * 2.9);
        const grd = g.createRadialGradient(x, y, 0, x, y, bloomR);
        grd.addColorStop(0, hexAlpha(v.color, 0.45 + flash * 0.2));
        grd.addColorStop(0.3, hexAlpha(v.color, 0.28 + flash * 0.15));
        grd.addColorStop(1, hexAlpha(v.color, 0));
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, bloomR, 0, Math.PI * 2);
        g.fill();
        g.globalCompositeOperation = prev;
        g.fillStyle = hexAlpha(v.color, b === 0 ? 0.75 : 0.3);
        g.beginPath();
        g.arc(x, y, rad * 0.55, 0, Math.PI * 2);
        g.fill();
      }
    });
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
