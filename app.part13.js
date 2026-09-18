      const amp = rowH * (0.28 + (1 - s) * 0.18);
      const phase = (t / period) * Math.PI * 2 + (v.phase || 0) * Math.PI * 2;
      g.strokeStyle = hexAlpha(v.color, 0.75);
      g.lineWidth = 1.6 + (v._flash || 0) * 2;
      g.beginPath();
      const steps = Math.max(80, Math.floor(span / 4));
      for (let x = 0; x <= steps; x++) {
        const u = x / steps;
        // hammer-ish: softer peaks via sin^3 blend
        const wave = Math.sin(u * Math.PI * 4 + phase);
        const hammer = Math.sign(wave) * Math.pow(Math.abs(wave), 0.65);
        const y = y0 + hammer * amp;
        const px = left + u * span;
        if (x === 0) g.moveTo(px, y);
        else g.lineTo(px, y);
      }
      g.stroke();
      g.fillStyle = hexAlpha(v.color, 0.7);
      g.font = "11px ui-monospace, monospace";
      g.fillText(v.name.slice(0, 8), 6, y0 + 4);
      // pulse marker at phase zero
      const uHit = ((-phase / (Math.PI * 2)) % 1 + 1) % 1;
      const hx = left + uHit * span;
      g.fillStyle = hexAlpha(v.color, 0.9);
      g.beginPath();
      g.arc(hx, y0, 4 + (v._flash || 0) * 6, 0, Math.PI * 2);
      g.fill();
    });
  }

  function drawSineRibbons(g, w, h, t) {
    // Sine Rhythms — stacked full-width sine curves
    const n = state.voices.length || 1;
    const top = 20;
    const bottom = h - 20;
    const band = (bottom - top) / n;
    state.voices.forEach((v, i) => {
      const y0 = top + band * (i + 0.5);
      const s = effectiveSimplicity(v);
      const period = voicePeriodSec(v);
      const amp = band * (0.32 + (1 - s) * 0.2);
      const phase = (t / period) * Math.PI * 2 + (v.phase || 0) * Math.PI * 2;
      const cycles = 2 + (i % 3);
      g.strokeStyle = hexAlpha(v.color, 0.15);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, y0);
      g.lineTo(w, y0);
      g.stroke();
      g.strokeStyle = hexAlpha(v.color, 0.8);
      g.lineWidth = 2 + (v._flash || 0) * 2.5;
      g.beginPath();
      const steps = Math.max(100, Math.floor(w / 3));
      for (let x = 0; x <= steps; x++) {
        const u = x / steps;
        const y = y0 + Math.sin(u * Math.PI * 2 * cycles + phase) * amp;
        const px = u * w;
        if (x === 0) g.moveTo(px, y);
        else g.lineTo(px, y);
      }
      g.stroke();
      // glow fill under ribbon
      g.lineTo(w, y0 + amp + 8);
      g.lineTo(0, y0 + amp + 8);
      g.closePath();
      g.fillStyle = hexAlpha(v.color, 0.04 + (v._flash || 0) * 0.08);
      g.fill();
    });
  }

  function hexAlpha(hex, a) {
    const h = toHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ---------- Transport ----------
  function setControlsHidden(hidden) {
    state.controlsHidden = !!hidden;
    document.body.classList.toggle("controls-hidden", state.controlsHidden);
    const btn = $("#toggleControls");
    if (btn) {
      btn.textContent = state.controlsHidden ? "Edit" : "Hide";
      btn.classList.toggle("active", !state.controlsHidden);
      btn.setAttribute("aria-pressed", String(!state.controlsHidden));
    }
  }

  function toggleControls() {
    setControlsHidden(!state.controlsHidden);
    if (!state.controlsHidden && autoHideTimer) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }
  }

  function scheduleAutoHide(ms = 2800) {
    if (autoHideTimer) clearTimeout(autoHideTimer);
    autoHideTimer = setTimeout(() => {
      if (state.playing) setControlsHidden(true);
      autoHideTimer = null;
    }, ms);
  }

  async function togglePlay() {

    initAudio();
    if (ctx.state === "suspended") await ctx.resume();
    if (!state.playing) {
      transportStart = ctx.currentTime;
      visualOrigin = performance.now();
      resetVoiceSchedulers();
      state.playing = true;
      startScheduler();
    } else {
      pauseAccum = transportTime();
      state.playing = false;
      stopScheduler();
