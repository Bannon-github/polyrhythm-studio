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
          if (k === "beatsInCycle" || k === "periodSec" || k === "usePeriod" || k === "simplicity") {
            v._nextHitTransport = null;
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
  function resizeCanvas() {
    const c = canvas();
    const wrap = $("#app") || c.parentElement;
    // Up to 4× for 4K / high Windows scaling (was capped at 2× and looked soft)
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 4);
    // Full-bleed stage: always viewport size — chrome floats over, never shrinks canvas
    const w = Math.max(1, wrap.clientWidth || window.innerWidth);
    const h = Math.max(1, wrap.clientHeight || window.innerHeight);
    // Prefer physical pixels; also ensure we can fill a 4K-class backing store when the stage is large
    let bw = Math.floor(w * dpr);
    let bh = Math.floor(h * dpr);
    const maxDim = 3840; // 4K width
    const maxH = 2160;
    // If CSS size is already near full-HD+ at low DPR, still allow up to 4K backing when dpr>1
    if (bw > maxDim * 2 || bh > maxH * 2) {
      // safety: avoid huge GPU buffers on multi-monitor ultrawides
      const scale = Math.min((maxDim * 2) / bw, (maxH * 2) / bh, 1);
      bw = Math.floor(bw * scale);
      bh = Math.floor(bh * scale);
    }
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
    if ("imageSmoothingQuality" in g) g.imageSmoothingQuality = "high";
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
