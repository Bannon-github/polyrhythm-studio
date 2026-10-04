    }
        document.body.classList.toggle("playing", state.playing);
    if (state.playing) scheduleAutoHide(2800);
    else if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
    syncMasterUI();
  }

  // ---------- Live dials ----------
  const DIAL_PATHS = [
    { id: "", label: "Auto" },
    { id: "circle", label: "Circle" },
    { id: "line", label: "Line" },
    { id: "square", label: "Square" },
    { id: "cube", label: "Cube" },
  ];

  function dialEl(name) {
    return document.querySelector('.dial[data-dial="' + name + '"]');
  }

  function clampStep(v, min, max, step) {
    const n = Math.max(min, Math.min(max, v));
    if (!step) return n;
    const snapped = Math.round((n - min) / step) * step + min;
    const dec = (String(step).split(".")[1] || "").length;
    return Number(Math.max(min, Math.min(max, snapped)).toFixed(dec));
  }

  function voicePitch01(v) {
    if (!v) return 0.5;
    if (typeof v._pitch01 === "number" && !Number.isNaN(v._pitch01)) return v._pitch01;
    const freq = (NOTE_FREQ && NOTE_FREQ[v.note]) || v.hz || 261.63;
    const t01 = Math.log(Math.max(20, freq) / 65.41) / Math.log(523.25 / 65.41);
    return Math.max(0, Math.min(1, t01));
  }

  function pathIndexOf(v) {
    const id = v && v.pathKind ? v.pathKind : "";
    const i = DIAL_PATHS.findIndex((p) => p.id === id);
    return i < 0 ? 0 : i;
  }

  function setNeedle(name, t01) {
    const needle = document.querySelector('.dial[data-dial="' + name + '"] .dial-needle');
    if (!needle) return;
    const turn = -135 + Math.max(0, Math.min(1, t01)) * 270;
    needle.style.transform = "rotate(" + turn + "deg)";
  }

  function syncDialReadouts() {
    const bpm = dialEl("bpm");
    const vol = dialEl("vol");
    const feel = dialEl("feel");
    const path = dialEl("path");
    const wet = dialEl("wet");
    const v0 = state.voices[0];
    if (bpm) {
      bpm.setAttribute("aria-valuenow", String(state.bpm));
      const read = $("#dialBpmRead");
      if (read) read.textContent = String(state.bpm);
      setNeedle("bpm", (state.bpm - 24) / (140 - 24));
    }
    if (vol) {
      vol.setAttribute("aria-valuenow", state.masterVolume.toFixed(2));
      const read = $("#dialVolRead");
      if (read) read.textContent = state.masterVolume.toFixed(2);
      setNeedle("vol", state.masterVolume);
    }
    if (feel) {
      feel.setAttribute("aria-valuenow", String(state.masterSimplicity));
      const read = $("#dialFeelRead");
      if (read) read.textContent = String(state.masterSimplicity);
      setNeedle("feel", state.masterSimplicity / 100);
    }
    if (path) {
      const idx = pathIndexOf(v0);
      path.setAttribute("aria-valuenow", String(idx));
      path.setAttribute("aria-valuetext", DIAL_PATHS[idx].label);
      const read = $("#dialPathRead");
      if (read) read.textContent = DIAL_PATHS[idx].label;
      setNeedle("path", idx / (DIAL_PATHS.length - 1));
    }
    if (wet) {
      wet.setAttribute("aria-valuenow", state.reverbWet.toFixed(2));
      const read = $("#dialWetRead");
      if (read) read.textContent = state.reverbWet.toFixed(2);
      setNeedle("wet", state.reverbWet / 0.9);
    }
    const cr = state.circularRhythm || { progression: "C", ringCount: state.circularRings || 8 };
    const chord = dialEl("chord");
    const rings = dialEl("rings");
    const prog = (typeof circNormalizeProgression === "function") ? circNormalizeProgression(cr.progression) : (cr.progression || "C");
    const chordLabel = (typeof CIRC_PROGRESSION_LABEL !== "undefined" && CIRC_PROGRESSION_LABEL[prog]) || "C";
    const chordIdx = Math.max(0, (typeof CIRC_PROGRESSIONS !== "undefined" ? CIRC_PROGRESSIONS : ["C"]).indexOf(prog));
    const ringN = Math.max(1, Math.min(8, cr.ringCount | 0 || 8));
    if (chord) {
      chord.setAttribute("aria-valuenow", String(chordIdx));
      chord.setAttribute("aria-valuetext", chordLabel);
      const read = $("#dialChordRead");
      if (read) read.textContent = chordLabel;
      setNeedle("chord", chordIdx / Math.max(1, ((typeof CIRC_PROGRESSIONS !== "undefined" ? CIRC_PROGRESSIONS.length : 6) - 1)));
    }
    if (rings) {
      rings.setAttribute("aria-valuenow", String(ringN));
      const read = $("#dialRingsRead");
      if (read) read.textContent = String(ringN);
      setNeedle("rings", (ringN - 1) / 7);
    }
  }

  function writeRange(sel, value) {
    const input = $(sel);
    if (!input) return;
    const min = Number(input.min);
    const max = Number(input.max);
    const step = Number(input.step) || 1;
    input.value = String(clampStep(value, min, max, step));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    syncDialReadouts();
  }

  function setVoice0Path(kind) {
    const v = state.voices[0];
    if (!v || v.pathKind === kind) {
      syncDialReadouts();
      return;
    }
    v.pathKind = kind;
    syncDialReadouts();
    saveLocal("autosave");
  }

  function applyDial(name, start, deltaPx) {
    if (name === "path") {
      const idx = Math.max(0, Math.min(DIAL_PATHS.length - 1, Math.round(start + deltaPx / 36)));
      setVoice0Path(DIAL_PATHS[idx].id);
      return;
    }
    if (name === "chord" || name === "circChord") {
      const chordMax = (typeof CIRC_PROGRESSIONS !== "undefined" ? CIRC_PROGRESSIONS.length : 6) - 1;
      const idx = Math.max(0, Math.min(chordMax, Math.round(start + deltaPx / 48)));
      setCircularChord(idx);
      return;
    }
    if (name === "rings" || name === "circRings") {
      setCircularRings(start + deltaPx / 36);
      return;
    }
    if (name === "circZoom") {
      setCircularZoom(start + (deltaPx / 140) * 1.4);
      return;
    }
    if (name === "circBpm") {
      writeRange("#bpm", start + (deltaPx / 140) * 116);
      syncCircularDialReadouts();
      return;
    }
    if (name === "circLine") {
      setCircularLine((start + deltaPx / 48) >= 0.5);
      return;
    }
    const spec = {
      bpm: ["#bpm", 116],
      vol: ["#masterVol", 1],
      feel: ["#masterSimplicity", 100],
      wet: ["#reverb", 0.9],
    }[name];
    if (!spec) return;
    writeRange(spec[0], start + (deltaPx / 140) * spec[1]);
  }

  function nudgeDial(name, dir) {
    if (name === "path") {
      const idx = pathIndexOf(state.voices[0]);
      const next = Math.max(0, Math.min(DIAL_PATHS.length - 1, idx + (dir > 0 ? 1 : -1)));
      setVoice0Path(DIAL_PATHS[next].id);
      return;
    }
    if (name === "circRings" || name === "rings") {
      const n = (state.circularRhythm && state.circularRhythm.ringCount) || state.circularRings || 8;
      setCircularRings(n + (dir > 0 ? 1 : -1));
      return;
    }
    if (name === "circChord" || name === "chord") {
      const prog = (state.circularRhythm && state.circularRhythm.progression) || "C";
      const ids = (typeof CIRC_PROGRESSIONS !== "undefined") ? CIRC_PROGRESSIONS : ["C"];
      const i = Math.max(0, ids.indexOf((typeof circNormalizeProgression === "function") ? circNormalizeProgression(prog) : prog));
      setCircularChord(i + (dir > 0 ? 1 : -1));
      return;
    }
    if (name === "circZoom") { setCircularZoom((state.circularZoom || 1) + (dir > 0 ? 0.05 : -0.05)); return; }
    if (name === "circBpm") {
      writeRange("#bpm", state.bpm + (dir > 0 ? 1 : -1));
      syncCircularDialReadouts();
      return;
    }
    if (name === "circLine") {
      setCircularLine(dir > 0);
      return;
    }
    const spec = {
      bpm: ["#bpm", 1],
      vol: ["#masterVol", 0.02],
      feel: ["#masterSimplicity", 2],
      wet: ["#reverb", 0.02],
    }[name];
    if (!spec) return;
    const input = $(spec[0]);
    if (!input) return;
    writeRange(spec[0], Number(input.value) + spec[1] * (dir > 0 ? 1 : -1));
  }

  function syncCircularDialReadouts() {
    const rings = dialEl("circRings");
    const chord = dialEl("circChord");
    const bpm = dialEl("circBpm");
    const zoom = dialEl("circZoom");
    const line = dialEl("circLine");
    const n = Math.max(1, Math.min(8, (state.circularRhythm && state.circularRhythm.ringCount) || state.circularRings | 0 || 8));
    const ids = (typeof CIRC_PROGRESSIONS !== "undefined") ? CIRC_PROGRESSIONS : ["C", "Am", "Em", "G5", "D5", "C5"];
    const prog = (typeof circNormalizeProgression === "function")
      ? circNormalizeProgression((state.circularRhythm && state.circularRhythm.progression) || ids[state.circularChord | 0] || "C")
      : "C";
    const ci = Math.max(0, ids.indexOf(prog));
    const labels = ids.map((id) => (typeof CIRC_PROGRESSION_LABEL !== "undefined" && CIRC_PROGRESSION_LABEL[id]) || id);
    if (rings) {
      rings.setAttribute("aria-valuenow", String(n));
      const read = $("#dialCircRingsRead");
      if (read) read.textContent = String(n);
      setNeedle("circRings", (n - 1) / 7);
    }
    if (chord) {
      chord.setAttribute("aria-valuenow", String(ci));
      chord.setAttribute("aria-valuetext", labels[ci] || "");
      const read = $("#dialCircChordRead");
      if (read) read.textContent = labels[ci] || String(ci);
      setNeedle("circChord", ci / Math.max(1, ids.length - 1));
    }
    if (bpm) {
      bpm.setAttribute("aria-valuenow", String(state.bpm));
      const read = $("#dialCircBpmRead");
      if (read) read.textContent = String(state.bpm);
      setNeedle("circBpm", (state.bpm - 24) / (140 - 24));
    }
    if (zoom) {
      const z = Math.max(0.45, Math.min(1.85, state.circularZoom || 1));
      zoom.setAttribute("aria-valuenow", z.toFixed(2));
      const read = $("#dialCircZoomRead");
      if (read) read.textContent = z.toFixed(2);
      setNeedle("circZoom", (z - 0.45) / (1.85 - 0.45));
    }
    if (line) {
      const on = state.circularLine !== false;
      line.setAttribute("aria-valuenow", on ? "1" : "0");
      line.setAttribute("aria-valuetext", on ? "On" : "Off");
      const read = $("#dialCircLineRead");
      if (read) read.textContent = on ? "On" : "Off";
      setNeedle("circLine", on ? 1 : 0);
    }
    document.body.classList.toggle("mode-circular", state.visualMode === "circular");
  }

  function setCircularRings(n) {
    const next = Math.max(1, Math.min(8, Math.round(n)));
    if (!circularMachineLive()) applyPreset("Circular Rhythm");
    const cr = state.circularRhythm;
    if (cr.ringCount === next && state.voices.length === next) {
      syncDialReadouts();
      syncCircularDialReadouts();
      return;
    }
    quietCrossings();
    installCircularVoices(cr.progression, cr.chordIndex, next);
    if (typeof renderVoiceList === "function") renderVoiceList();
    syncDialReadouts();
    syncCircularDialReadouts();
    saveLocal("autosave");
  }

  function setCircularChord(i) {
    const ids = (typeof CIRC_PROGRESSIONS !== "undefined") ? CIRC_PROGRESSIONS : ["C"];
    const next = Math.max(0, Math.min(ids.length - 1, Math.round(i)));
    if (!circularMachineLive()) applyPreset("Circular Rhythm");
    const progression = ids[next];
    const cr = state.circularRhythm;
    if (cr.progression === progression) {
      syncDialReadouts();
      syncCircularDialReadouts();
      return;
    }
    quietCrossings();
    touchCircularNotesOnly(progression, 0);
    if (typeof renderVoiceList === "function") renderVoiceList();
    syncDialReadouts();
    syncCircularDialReadouts();
    saveLocal("autosave");
  }

  function setCircularLine(on) {
    const next = !!on;
    if (next === (state.circularLine !== false)) {
      syncCircularDialReadouts();
      return;
    }
    quietCrossings();
    state.circularLine = next;
    if (!state.circularLine) {
      if (typeof circParts !== "undefined") circParts.length = 0;
      if (typeof circReverbs !== "undefined") circReverbs.length = 0;
    }
    syncCircularDialReadouts();
    saveLocal("autosave");
  }

  function setCircularZoom(z) {
    const next = Math.max(0.45, Math.min(1.85, Number(z)));
    const rounded = Math.round(next * 100) / 100;
    if (rounded === state.circularZoom) {
      syncCircularDialReadouts();
      return;
    }
    quietCrossings();
    state.circularZoom = rounded;
    syncCircularDialReadouts();
    saveLocal("autosave");
  }

  function bindDials() {
    document.querySelectorAll(".dial").forEach((el) => {
      let drag = null;
      el.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        const name = el.dataset.dial;
        let start = 0;
        if (name === "path") start = pathIndexOf(state.voices[0]);
        else if (name === "bpm" || name === "circBpm") start = state.bpm;
        else if (name === "vol") start = state.masterVolume;
        else if (name === "feel") start = state.masterSimplicity;
        else if (name === "wet") start = state.reverbWet;
        else if (name === "circRings" || name === "rings") start = (state.circularRhythm && state.circularRhythm.ringCount) || state.circularRings || 8;
        else if (name === "circChord" || name === "chord") {
          const prog = (state.circularRhythm && state.circularRhythm.progression) || "C";
          const ids = (typeof CIRC_PROGRESSIONS !== "undefined") ? CIRC_PROGRESSIONS : ["C"];
          start = Math.max(0, ids.indexOf((typeof circNormalizeProgression === "function") ? circNormalizeProgression(prog) : prog));
        }
        else if (name === "circZoom") start = state.circularZoom || 1;
        else if (name === "circLine") start = state.circularLine === false ? 0 : 1;
        drag = { y: e.clientY, x: e.clientX, start };
      });
      el.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const delta = (drag.y - e.clientY) + (e.clientX - drag.x) * 0.35;
        applyDial(el.dataset.dial, drag.start, delta);
      });
      const end = () => { drag = null; };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      el.addEventListener("wheel", (e) => {
        e.preventDefault();
        nudgeDial(el.dataset.dial, e.deltaY < 0 ? 1 : -1);
      }, { passive: false });
      el.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault();
          nudgeDial(el.dataset.dial, 1);
        } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault();
          nudgeDial(el.dataset.dial, -1);
        }
      });
    });
  }

  function paintDialGlow(now) {
    const t = now / 1000;
    const speedN = (state.bpm - 24) / (140 - 24);
    const beat = 0.5 + 0.5 * Math.sin(t * (state.bpm / 60) * Math.PI * 2);
    let flash = 0;
    for (let i = 0; i < state.voices.length; i++) {
      flash = Math.max(flash, state.voices[i]._flash || 0);
    }
    flash = Math.max(0, Math.min(1, flash));
    const v0 = state.voices[0];
    // Feel dial owns masterSimplicity — backlight must track that value (not pitch).
    const feelN = Math.max(0, Math.min(1, state.masterSimplicity / 100));
    const feelHue = 28 + feelN * 130; // complex/warm → simple/green-cyan
    const specs = {
      bpm: [200 - speedN * 168, 0.32 + speedN * 0.62, 0.42 + beat * 0.58, flash * 0.85],
      vol: [208, 0.16 + state.masterVolume * 0.84, 0.35 + state.masterVolume * 0.55, flash * state.masterVolume],
      feel: [feelHue, 0.18 + feelN * 0.78, 0.32 + feelN * 0.55 + beat * 0.1, flash * (0.25 + feelN * 0.7)],
      path: [{ "": 262, circle: 196, line: 150, square: 38, cube: 312 }[(v0 && v0.pathKind) || ""] || 262, 0.62, 0.55 + beat * 0.2, flash * 0.7],
      wet: [166 + (state.reverbWet / 0.9) * 36, 0.28 + (state.reverbWet / 0.9) * 0.62, 0.4 + (state.reverbWet / 0.9) * 0.4 + beat * 0.12, flash * 0.35],
      rings: [210, 0.35 + (((state.circularRhythm && state.circularRhythm.ringCount) || 8) - 1) / 7 * 0.55, 0.45 + beat * 0.25, flash * 0.5],
      chord: [280 - ((state.circularRhythm && CIRC_PROGRESSIONS.indexOf(state.circularRhythm.progression)) || 0) * 40, 0.55, 0.5 + beat * 0.2, flash * 0.55],
      circRings: [210, 0.35 + (((state.circularRhythm && state.circularRhythm.ringCount) || 8) - 1) / 7 * 0.55, 0.45 + beat * 0.25, flash * 0.5],
      circChord: [280 - ((state.circularRhythm && CIRC_PROGRESSIONS.indexOf(state.circularRhythm.progression)) || 0) * 40, 0.55, 0.5 + beat * 0.2, flash * 0.55],
      circBpm: [200 - speedN * 168, 0.32 + speedN * 0.62, 0.42 + beat * 0.58, flash * 0.85],
      circZoom: [170, 0.3 + ((state.circularZoom || 1) - 0.45) / 1.4 * 0.6, 0.45 + beat * 0.15, flash * 0.4],
      circLine: [state.circularLine === false ? 220 : 48, state.circularLine === false ? 0.12 : 0.7, 0.4 + beat * 0.2, flash * 0.45],
    };
    Object.keys(specs).forEach((name) => {
      const el = dialEl(name);
      if (!el) return;
      const s = specs[name];
      el.style.setProperty("--hue", String(s[0]));
      el.style.setProperty("--lit", String(s[1]));
      el.style.setProperty("--pulse", String(s[2]));
      el.style.setProperty("--flash", String(s[3]));
    });
  }

  // ---------- Bindings ----------
  function bindUI() {
    bindDials();
    $("#playBtn").addEventListener("click", togglePlay);
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.mode === "circular" && !circularMachineLive()) {
          applyPreset("Circular Rhythm");
          return;
        }
        state.visualMode = btn.dataset.mode;
        syncMasterUI();
        saveLocal("autosave");
      });
    });
    const visualModeEl = $("#visualMode");
    if (visualModeEl) {
      visualModeEl.addEventListener("change", (e) => {
        if (e.target.value === "circular" && !circularMachineLive()) {
          applyPreset("Circular Rhythm");
          return;
        }
        state.visualMode = e.target.value;
        syncMasterUI();
        saveLocal("autosave");
      });
    }
    document.querySelectorAll("[data-look]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.look;
        if (!state.gateLooks) state.gateLooks = {};
        state.gateLooks[k] = !state.gateLooks[k];
        syncMasterUI();
        saveLocal("autosave");
      });
    });
    const quadraticEl = $("#quadraticLength");
    if (quadraticEl) {
      quadraticEl.addEventListener("change", (e) => {
        state.quadraticLength = e.target.checked;
        saveLocal("autosave");
      });
    }

    $("#bpm").addEventListener("input", (e) => {
      const nextBpm = Number(e.target.value);
      if (nextBpm !== state.bpm) quietCrossings();
      state.bpm = nextBpm;
      $("#bpmVal").textContent = state.bpm;
      resetVoiceSchedulers();
      if (circularMachineLive()) {
        state.voices.forEach((v, i) => {
          v.periodSec = circularRingPeriod(i);
          v.beatsInCycle = i + 1;
          v.usePeriod = true;
          v.phase = 0;
        });
      }
      if (typeof syncCircularDialReadouts === "function") syncCircularDialReadouts();
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
