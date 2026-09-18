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

  function drawTriangles(g, w, h, t) {
    const n = state.voices.length || 1;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cellW = w / cols;
    const cellH = h / rows;
    state.voices.forEach((v, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = cellW * (col + 0.5);
      const cy = cellH * (row + 0.5);
      const s = effectiveSimplicity(v);
      const period = voicePeriodSec(v);
      const sides = Math.max(3, Math.min(9, Math.round(v.beatsInCycle) || 3));
      const rot = ((t / period) % 1) * Math.PI * 2 + (v.phase || 0) * Math.PI * 2;
      const R = Math.min(cellW, cellH) * (0.28 + (1 - s) * 0.12);
      g.strokeStyle = hexAlpha(v.color, 0.55 + (v._flash || 0) * 0.4);
      g.lineWidth = 1.5 + (v._flash || 0) * 2;
      g.beginPath();
      for (let k = 0; k <= sides; k++) {
        const a = rot + (k / sides) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        if (k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.stroke();
      g.fillStyle = hexAlpha(v.color, 0.08 + (v._flash || 0) * 0.2);
      g.fill();
      g.fillStyle = hexAlpha(v.color, 0.85);
      g.beginPath();
      g.arc(cx, cy, 3 + (v._flash || 0) * 5, 0, Math.PI * 2);
      g.fill();
    });
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
