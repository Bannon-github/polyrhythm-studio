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
  function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (state.playing) evolveStep(dt);
    draw(now);
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
