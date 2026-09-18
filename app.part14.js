    }
        document.body.classList.toggle("playing", state.playing);
    if (state.playing) scheduleAutoHide(2800);
    else if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
    syncMasterUI();
  }

  // ---------- Bindings ----------
  function bindUI() {
    $("#playBtn").addEventListener("click", togglePlay);
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.visualMode = btn.dataset.mode;
        syncMasterUI();
        saveLocal("autosave");
      });
    });
    const visualModeEl = $("#visualMode");
    if (visualModeEl) {
      visualModeEl.addEventListener("change", (e) => {
        state.visualMode = e.target.value;
        syncMasterUI();
        saveLocal("autosave");
      });
    }
    const quadraticEl = $("#quadraticLength");
    if (quadraticEl) {
      quadraticEl.addEventListener("change", (e) => {
        state.quadraticLength = e.target.checked;
        saveLocal("autosave");
      });
    }

    $("#bpm").addEventListener("input", (e) => {
      state.bpm = Number(e.target.value);
      $("#bpmVal").textContent = state.bpm;
      resetVoiceSchedulers();
    });
    $("#masterCycle").addEventListener("change", (e) => {
      state.masterCycleSec = Number(e.target.value);
      state.useBpm = false;
      resetVoiceSchedulers();
    });
    $("#useBpm").addEventListener("change", (e) => {
      state.useBpm = e.target.checked;
      resetVoiceSchedulers();
    });
    $("#masterVol").addEventListener("input", (e) => {
      state.masterVolume = Number(e.target.value);
      $("#masterVolVal").textContent = state.masterVolume.toFixed(2);
      if (masterGain) masterGain.gain.value = state.masterVolume;
    });
    $("#reverb").addEventListener("input", (e) => {
      state.reverbWet = Number(e.target.value);
      $("#reverbVal").textContent = state.reverbWet.toFixed(2);
      if (reverbGain) reverbGain.gain.value = state.reverbWet;
    });
    $("#delay").addEventListener("input", (e) => {
      state.delayWet = Number(e.target.value);
      $("#delayVal").textContent = state.delayWet.toFixed(2);
      if (delayGain) delayGain.gain.value = state.delayWet;
    });
    $("#evolve").addEventListener("change", (e) => { state.evolve = e.target.checked; });
    $("#evolveRate").addEventListener("input", (e) => { state.evolveRate = Number(e.target.value); });

    $("#masterSimplicity").addEventListener("input", (e) => {
      state.masterSimplicity = Number(e.target.value);
      $("#masterSimplicityVal").textContent = simplicityLabel(state.masterSimplicity);
      resetVoiceSchedulers();
      saveLocal("autosave");
    });

    // Quick simplicity presets
    document.querySelectorAll("[data-sim-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const level = btn.dataset.simPreset;
        const map = { simple: 78, medium: 48, complex: 18 };
        state.masterSimplicity = map[level] ?? 50;
        // Also nudge all voices toward that feel
        state.voices.forEach((v) => {
          v.simplicity = Math.round(v.simplicity * 0.35 + state.masterSimplicity * 0.65);
        });
        syncMasterUI();
        renderVoiceList();
        resetVoiceSchedulers();
        saveLocal("autosave");
      });
    });

    $("#preset").innerHTML =
      `<option value="">Load preset…</option>` +
      Object.keys(PRESETS).map((k) => `<option value="${k}">${k}</option>`).join("");
    $("#preset").addEventListener("change", (e) => {
      if (e.target.value) applyPreset(e.target.value);
    });

    $("#applyRatio").addEventListener("click", () => {
      applyRatio(Number($("#ratioA").value), Number($("#ratioB").value));
      saveLocal("autosave");
    });

    $("#addVoice").addEventListener("click", () => {
      if (state.voices.length >= MAX_VOICES) return;
      const beats = state.voices.length ? state.voices[state.voices.length - 1].beatsInCycle + 1 : 3;
