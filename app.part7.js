    if (state.voices[0]) {
      state.voices[0].beatsInCycle = a;
      state.voices[0].usePeriod = false;
      state.voices[0].name = String(a);
      state.voices[0].simplicity = Math.min(100, Math.round(simA * (0.5 + scale * 0.5)));
    }
    if (state.voices[1]) {
      state.voices[1].beatsInCycle = b;
      state.voices[1].usePeriod = false;
      state.voices[1].name = String(b);
      state.voices[1].simplicity = Math.min(100, Math.round(simB * (0.5 + scale * 0.5)));
    }
    resetVoiceSchedulers();
    renderVoiceList();
  }

  function gcd(x, y) {
    x = Math.abs(x); y = Math.abs(y);
    while (y) { const t = y; y = x % y; x = t; }
    return x;
  }

  // ---------- Persistence ----------
  function serialize() {
    return {
      configVersion: 2,
      bpm: state.bpm,
      useBpm: state.useBpm,
      masterCycleSec: state.masterCycleSec,
      masterVolume: state.masterVolume,
      reverbWet: state.reverbWet,
      delayWet: state.delayWet,
      evolve: state.evolve,
      evolveRate: state.evolveRate,
      masterSimplicity: state.masterSimplicity,
      visualMode: state.visualMode,
      quadraticLength: state.quadraticLength,
      voices: state.voices.map((v) => ({
        name: v.name,
        beatsInCycle: v.beatsInCycle,
        usePeriod: v.usePeriod,
        periodSec: v.periodSec,
        pitchMode: v.pitchMode,
        note: v.note,
        hz: v.hz,
        waveform: v.waveform,
        volume: v.volume,
        mute: v.mute,
        color: v.color,
        pan: v.pan,
        phase: v.phase,
        simplicity: v.simplicity,
      })),
    };
  }

  function loadSerialized(data) {
    if (!data) return;
    Object.assign(state, {
      bpm: data.bpm ?? state.bpm,
      useBpm: data.useBpm ?? state.useBpm,
      masterCycleSec: data.masterCycleSec ?? state.masterCycleSec,
      masterVolume: data.masterVolume ?? state.masterVolume,
      reverbWet: data.reverbWet ?? state.reverbWet,
      delayWet: data.delayWet ?? state.delayWet,
      evolve: !!data.evolve,
      evolveRate: data.evolveRate ?? state.evolveRate,
      masterSimplicity: data.masterSimplicity ?? 50,
      visualMode: data.visualMode || "pendulum",
      quadraticLength: !!data.quadraticLength,
    });
    state.nextVoiceId = 1;
    state.voices = (data.voices || []).map((v) => makeVoice(v));
    if (!state.voices.length) applyPreset("3:2 classic");
    resetVoiceSchedulers();
  }

  function saveLocal(key = "polyrhythm-studio") {
    try { localStorage.setItem(key, JSON.stringify(serialize())); } catch (_) {}
  }

  function loadLocal(key = "polyrhythm-studio") {
    try {
      const raw = localStorage.getItem(key) || localStorage.getItem("autosave");
      if (raw) loadSerialized(JSON.parse(raw));
    } catch (_) {}
  }

  // ---------- UI ----------
  const $ = (sel) => document.querySelector(sel);
  const canvas = () => $("#stage");

  function syncMasterUI() {
    $("#bpm").value = state.bpm;
    $("#bpmVal").textContent = state.bpm;
    $("#masterCycle").value = state.masterCycleSec;
    $("#masterVol").value = state.masterVolume;
    $("#masterVolVal").textContent = state.masterVolume.toFixed(2);
    $("#reverb").value = state.reverbWet;
    $("#reverbVal").textContent = state.reverbWet.toFixed(2);
    $("#delay").value = state.delayWet;
    $("#delayVal").textContent = state.delayWet.toFixed(2);
    $("#evolve").checked = state.evolve;
    $("#evolveRate").value = state.evolveRate;
    $("#masterSimplicity").value = state.masterSimplicity;
    $("#masterSimplicityVal").textContent = simplicityLabel(state.masterSimplicity);
    $("#preset").value = "";
    const modeSel = $("#visualMode");
    if (modeSel) modeSel.value = state.visualMode;
    const qLen = $("#quadraticLength");
    if (qLen) qLen.checked = !!state.quadraticLength;
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === state.visualMode);
    });
