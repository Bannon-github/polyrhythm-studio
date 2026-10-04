      state.voices.push(makeVoice({
        beatsInCycle: Math.min(24, beats),
        note: NOTES[Math.min(NOTES.length - 1, 10 + state.voices.length)],
        simplicity: state.masterSimplicity,
      }));
      renderVoiceList();
      saveLocal("autosave");
    });

    $("#saveSetup").addEventListener("click", () => {
      saveLocal("polyrhythm-studio");
      $("#saveSetup").textContent = "Saved!";
      setTimeout(() => { $("#saveSetup").textContent = "Save"; }, 1200);
    });
    $("#loadSetup").addEventListener("click", () => {
      loadLocal("polyrhythm-studio");
      syncMasterUI();
      renderVoiceList();
    });

    window.addEventListener("resize", resizeCanvas);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resizeCanvas);
    }
    // Re-bind when moving between monitors / Windows display scale changes
    try {
      matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener("change", resizeCanvas);
    } catch (_) {}
    const toggleBtn = $("#toggleControls");
    if (toggleBtn) toggleBtn.addEventListener("click", toggleControls);

    window.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable);
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (typing) return;
      if (e.key === "h" || e.key === "H" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        toggleControls();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setControlsHidden(true);
      }
    });
  }

  // ---------- Loop ----------
  let lastFrame = performance.now();
  let heatLevel = 1;
  let heatFrom = 1;
  let heatTo = 1;
  let heatDuckT0 = 0;
  let heatDuckUntil = 0;
  let heatRecovering = false;
  let heatRecoverFrom = 1;
  let heatRecoverT0 = 0;
  let heatFlagHot = false;

  function heatAudible(t) {
    if (heatRecovering) {
      const u = Math.min(1, (t - heatRecoverT0) / 1.5);
      return heatRecoverFrom + (1 - heatRecoverFrom) * u;
    }
    if (t < heatDuckUntil) {
      const u = Math.min(1, (t - heatDuckT0) / 0.04);
      return heatFrom + (heatTo - heatFrom) * u;
    }
    return heatLevel;
  }

  function masterBufferHot() {
    hotAnalyser.getFloatTimeDomainData(hotBuf);
    let peak = 0;
    let over = 0;
    for (let i = 0; i < hotBuf.length; i++) {
      const a = Math.abs(hotBuf[i]);
      if (a > peak) peak = a;
      if (a > 0.89) over++;
    }
    return peak >= 0.98 || over > 4;
  }

  function setHeatFlag(hot) {
    if (hot === heatFlagHot) return;
    heatFlagHot = hot;
    const el = document.getElementById("heatFlag");
    if (!el) return;
    el.textContent = hot ? "hot" : "clean";
    el.classList.toggle("is-hot", hot);
  }

  // easeGain sits after softLimiter and before destination. Duck it when the
  // speaker tap is hot; ease it back while frames stay clean.
  function watchMasterHeat() {
    if (!hotAnalyser || !easeGain || !ctx || !hotBuf) return;
    const t = ctx.currentTime;
    const hot = masterBufferHot();
    const cur = heatAudible(t);
    if (hot) {
      if (t >= heatDuckUntil - 0.001) {
        const to = Math.max(0.45, cur * 0.85);
        if (to < cur - 0.0005) {
          easeGain.gain.cancelScheduledValues(t);
          easeGain.gain.setValueAtTime(cur, t);
          easeGain.gain.linearRampToValueAtTime(to, t + 0.04);
          heatFrom = cur;
          heatTo = to;
          heatLevel = to;
          heatDuckT0 = t;
          heatDuckUntil = t + 0.04;
          heatRecovering = false;
        }
      }
      setHeatFlag(heatAudible(t) < 0.999);
      return;
    }
    if (cur >= 0.999) {
      heatLevel = 1;
      heatRecovering = false;
      setHeatFlag(false);
      return;
    }
    if (!heatRecovering) {
      heatRecovering = true;
      heatRecoverFrom = cur;
      heatRecoverT0 = t;
      heatLevel = 1;
      easeGain.gain.cancelScheduledValues(t);
      easeGain.gain.setValueAtTime(cur, t);
      easeGain.gain.linearRampToValueAtTime(1, t + 1.5);
    }
    setHeatFlag(heatAudible(t) < 0.999);
  }

  let frameSerial = 0;
  function frame(now) {
    const gap = now - lastFrame;
    const dt = Math.min(0.05, gap / 1000);
    lastFrame = now;
    watchMasterHeat();
    if (state.playing) evolveStep(dt);
    frameSerial++;
    const skipPaint = renderStride > 1 && (frameSerial % renderStride) !== 0;
    const t0 = performance.now();
    if (skipPaint) {
      // Paint drops a frame; gate sampling still runs so tone-on-cross holds.
      if (state.visualMode === "gate") {
        const c = canvas();
        const transport = state.playing ? transportTime() : pauseAccum;
        drawGate(c.getContext("2d"), c.clientWidth, c.clientHeight, transport, true);
      }
      state.voices.forEach((v) => {
        v._flash = Math.max(0, (v._flash || 0) - 0.028);
        if (v._flash === 0) { v._flashX = null; v._flashY = null; }
      });
    } else {
      draw(now);
    }
    paintDialGlow(now);
    noteFrameCost(performance.now() - t0, gap);
    requestAnimationFrame(frame);
  }

  // ---------- Boot ----------
  function boot() {
    let loadedOk = false;
    try {
      const raw = localStorage.getItem("polyrhythm-studio") || localStorage.getItem("autosave");
      if (raw) {
        const data = JSON.parse(raw);
        if ((data.configVersion || 0) >= 2) {
          loadSerialized(data);
          loadedOk = true;
        }
        // else: stale pre-v2 autosave — ignore and apply Session Ready below
      }
    } catch (_) {}
    if (!loadedOk || !state.voices.length) {
      applyPreset("Session Ready"); // also saveLocal("autosave") with configVersion: 2
    }
    bindUI();
    setControlsHidden(state.controlsHidden !== false); // default immersive: drawer hidden
    syncMasterUI();
    renderVoiceList();
    resizeCanvas();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
