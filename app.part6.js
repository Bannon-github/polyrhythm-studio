      visualMode: "triangles",
      voices: [
        { name: "Tri 3", beatsInCycle: 3, note: "G3", waveform: "triangle", volume: 0.5, simplicity: 40, pan: -0.35, color: COLORS[0] },
        { name: "Tri 4", beatsInCycle: 4, note: "C4", waveform: "sine", volume: 0.45, simplicity: 42, pan: 0, color: COLORS[2] },
        { name: "Tri 5", beatsInCycle: 5, note: "E4", waveform: "bell", volume: 0.38, simplicity: 45, pan: 0.35, color: COLORS[1] },
        { name: "Tri 7", beatsInCycle: 7, note: "A3", waveform: "triangle", volume: 0.4, simplicity: 48, pan: 0.15, color: COLORS[5] },
      ],
    }),
    "Pulse Orbits": () => ({
      bpm: 58,
      useBpm: true,
      masterSimplicity: 48,
      reverbWet: 0.4,
      delayWet: 0.26,
      evolve: true,
      evolveRate: 0.11,
      visualMode: "circular",
      voices: [
        { name: "Orbit 1", beatsInCycle: 11, note: "D5", waveform: "sine", volume: 0.26, simplicity: 40, pan: -0.5, phase: 0.0, color: COLORS[0] },
        { name: "Orbit 2", beatsInCycle: 9, note: "A4", waveform: "triangle", volume: 0.3, simplicity: 45, pan: -0.25, phase: 0.12, color: COLORS[2] },
        { name: "Orbit 3", beatsInCycle: 7, note: "E4", waveform: "bell", volume: 0.34, simplicity: 50, pan: 0.1, phase: 0.24, color: COLORS[1] },
        { name: "Orbit 4", beatsInCycle: 5, note: "B3", waveform: "sine", volume: 0.4, simplicity: 55, pan: 0.3, phase: 0.36, color: COLORS[4] },
        { name: "Orbit 5", beatsInCycle: 3, note: "E3", waveform: "pad", volume: 0.42, simplicity: 60, pan: 0.15, phase: 0.5, color: COLORS[3] },
        { name: "Pulse", beatsInCycle: 2, note: "E2", waveform: "kick", volume: 0.48, simplicity: 70, pan: 0, phase: 0, color: COLORS[6] },
      ],
    }),
    "Lost In Space": () => ({
      bpm: 34,
      useBpm: true,
      masterSimplicity: 90,
      reverbWet: 0.72,
      delayWet: 0.4,
      evolve: true,
      evolveRate: 0.05,
      visualMode: "pendulum",
      quadraticLength: true,
      voices: [
        { name: "Far", beatsInCycle: 2, note: "C2", waveform: "pad", volume: 0.36, simplicity: 92, pan: -0.3, color: "#4a5080" },
        { name: "Drift", beatsInCycle: 3, note: "G2", waveform: "sine", volume: 0.26, simplicity: 90, pan: 0.4, color: COLORS[1] },
        { name: "Spark", beatsInCycle: 5, note: "D5", waveform: "bell", volume: 0.16, simplicity: 88, pan: -0.5, color: "#ffe0a0" },
        { name: "Void Pad", beatsInCycle: 1, note: "C2", waveform: "sine", volume: 0.32, simplicity: 95, pan: 0.05, color: COLORS[6] },
      ],
    }),
  };

  function applyPreset(name) {
    const factory = PRESETS[name];
    if (!factory) return;
    const p = factory();
    state.bpm = p.bpm ?? state.bpm;
    state.useBpm = p.useBpm ?? true;
    state.masterSimplicity = p.masterSimplicity ?? 50;
    state.reverbWet = p.reverbWet ?? state.reverbWet;
    state.delayWet = p.delayWet ?? state.delayWet;
    state.evolve = !!p.evolve;
    state.evolveRate = p.evolveRate ?? state.evolveRate;
    if (p.visualMode) state.visualMode = p.visualMode;
    if (p.quadraticLength != null) state.quadraticLength = !!p.quadraticLength;
    state.nextVoiceId = 1;
    state.voices = (p.voices || []).map((v) => makeVoice(v));
    if (ctx) {
      reverbGain.gain.value = state.reverbWet;
      delayGain.gain.value = state.delayWet;
    }
    resetVoiceSchedulers();
    syncMasterUI();
    renderVoiceList();
    saveLocal("autosave");
  }

  function applyRatio(a, b) {
    a = Math.max(1, Math.min(24, Math.round(a)));
    b = Math.max(1, Math.min(24, Math.round(b)));
    // Complexity hint from ratio: coprime large numbers → lower default simplicity
    const complex = (gcd(a, b) === 1 && (a > 4 || b > 4));
    const simA = complex ? 30 : 50;
    const simB = complex ? 35 : 55;
    // Map master simplicity toward simpler if user has high master simple
    const scale = state.masterSimplicity / 50;
    while (state.voices.length < 2 && state.voices.length < MAX_VOICES) {
      state.voices.push(makeVoice({}));
    }
