        const ev = el.type === "range" || el.type === "color" ? "input" : "change";
        el.addEventListener(ev, () => {
          const k = el.dataset.k;
          let val;
          if (el.type === "checkbox") val = el.checked;
          else if (el.type === "number" || el.type === "range") val = Number(el.value);
          else val = el.value;
          v[k] = val;
          if (k === "volume" || k === "pan" || k === "simplicity") {
            const valEl = el.parentElement.querySelector(".val");
            if (valEl) valEl.textContent = k === "simplicity" ? simplicityLabel(v.simplicity) : Number(val).toFixed(2);
          }
          if (k === "note" || k === "hz" || k === "pitchMode") publishPitchHint(v);
          if (k === "beatsInCycle" || k === "periodSec" || k === "usePeriod" || k === "simplicity" || k === "phase") {
            v._nextHitTransport = null;
            v._nextGateAfter = null;
          }
          card.classList.toggle("muted", !!v.mute);
          saveLocal("autosave");
        });
      });
      card.querySelector('[data-act="rm"]').addEventListener("click", () => {
        state.voices = state.voices.filter((x) => x.id !== v.id);
        renderVoiceList();
        saveLocal("autosave");
      });
      card.querySelector('[data-act="dup"]').addEventListener("click", () => {
        if (state.voices.length >= MAX_VOICES) return;
        const copy = makeVoice({ ...v, name: v.name + "·" });
        state.voices.splice(idx + 1, 0, copy);
        renderVoiceList();
        saveLocal("autosave");
      });
      list.appendChild(card);
    });
    $("#addVoice").disabled = state.voices.length >= MAX_VOICES;
    $("#voiceCount").textContent = `${state.voices.length}/${MAX_VOICES}`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function toHex(c) {
    if (c.startsWith("#") && c.length === 7) return c;
    return "#7c9cff";
  }

  // ---------- Visuals ----------
  // Backing-store long-edge caps: low, HD, QHD, 4K. Never above device pixels.
  const RENDER_TIERS = [1280, 1920, 2560, 3840];
  let renderTier = 1;
  let renderStride = 1;
  let renderOver = 0;
  let renderUnder = 0;
  const renderGaps = [];

  function displayLongEdge() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const sw = (window.screen && screen.width) || window.innerWidth;
    const sh = (window.screen && screen.height) || window.innerHeight;
    return Math.max(sw, sh) * dpr;
  }

  // Highest tier this display is worth. 4K only if the panel is 4K-class.
  function renderCap() {
    const long = displayLongEdge();
    if (long >= 3200) return 3;
    if (long >= 2200) return 2;
    if (long >= 1600) return 1;
    return 0;
  }

  // Open conservative. Strong 4K machines start at 4K; everyone else HD or below.
  // deviceMemory is often missing — missing is not "strong", so we do not start at 4K.
  function renderStartTier() {
    const cap = renderCap();
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory;
    if (cap >= 3 && cores >= 8 && mem >= 8) return 3;
    if (cores <= 2) return 0;
    return Math.min(cap, 1);
  }
  renderTier = renderStartTier();

  function resizeCanvas() {
    const c = canvas();
    const wrap = $("#app") || c.parentElement;
    const cap = renderCap();
    if (renderTier > cap) renderTier = cap;
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 4);
    const w = Math.max(1, wrap.clientWidth || window.innerWidth);
    const h = Math.max(1, wrap.clientHeight || window.innerHeight);
    const maxEdge = RENDER_TIERS[renderTier] || 1920;
    let scale = dpr;
    const long = Math.max(w, h);
    if (long * scale > maxEdge) scale = maxEdge / long;
    scale = Math.min(scale, dpr);
    const bw = Math.max(1, Math.floor(w * scale));
    const bh = Math.max(1, Math.floor(h * scale));
    if (c.width !== bw || c.height !== bh) {
      c.width = bw;
      c.height = bh;
    }
    c.style.width = w + "px";
    c.style.height = h + "px";
    const g = c.getContext("2d", { alpha: true });
    const sx = bw / w;
    const sy = bh / h;
    g.setTransform(sx, 0, 0, sy, 0, 0);
    g.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in g) g.imageSmoothingQuality = renderTier >= 2 ? "high" : "medium";
    c.dataset.renderTier = String(renderTier);
    c.dataset.renderStride = String(renderStride);
    window.__psRender = { tier: renderTier, cap, stride: renderStride, bw, bh, cssW: w, cssH: h, dpr };
  }

  // costMs is draw time. gapMs is the rAF interval (display vsync when we keep up).
  // 90 Hz is the target only when the display is already ~90; otherwise fit the real refresh.
  function noteFrameCost(costMs, gapMs) {
    if (gapMs > 4 && gapMs < 40) {
      renderGaps.push(gapMs);
      if (renderGaps.length > 24) renderGaps.shift();
    }
    const sorted = renderGaps.length ? renderGaps.slice().sort((a, b) => a - b) : [16.7];
    const vsync = sorted[sorted.length >> 1];
    const budget = vsync <= 12.5 ? (1000 / 90) : vsync * 0.88;
    const cap = renderCap();
    if (costMs > budget) {
      renderOver++;
      renderUnder = 0;
      if (renderOver >= 8 && renderTier > 0) {
        renderTier--;
        renderOver = 0;
        resizeCanvas();
      } else if (renderOver >= 14 && renderTier === 0 && renderStride < 2) {
        renderStride = 2;
        renderOver = 0;
        const c = canvas();
        if (c) c.dataset.renderStride = "2";
        if (window.__psRender) window.__psRender.stride = 2;
      }
    } else if (costMs < budget * 0.5) {
      renderUnder++;
      renderOver = 0;
      if (renderStride > 1 && renderUnder >= 24) {
        renderStride = 1;
        renderUnder = 0;
        const c = canvas();
        if (c) c.dataset.renderStride = "1";
        if (window.__psRender) window.__psRender.stride = 1;
      } else if (renderStride === 1 && renderUnder >= 45 && renderTier < cap) {
        renderTier++;
        renderUnder = 0;
        resizeCanvas();
      }
    } else {
      renderOver = Math.max(0, renderOver - 1);
      renderUnder = 0;
    }
  }

  function pendulumAngle(v, t) {
    const period = voicePeriodSec(v);
    // Simple harmonic: angle = A * cos(2π t / period)
    return Math.cos((Math.PI * 2 * t) / period + (v.phase || 0) * Math.PI * 2);
  }

  function draw(t) {
    const c = canvas();
    const g = c.getContext("2d");
    const w = c.clientWidth;
    const h = c.clientHeight;
    // Near-black void fill (additive glow on top)
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#020308";
    g.fillRect(0, 0, w, h);

    // Softened sparse starfield (fewer / dimmer)
    for (let i = 0; i < 24; i++) {
