      mute: partial.mute ?? false,
      color,
      pan: partial.pan ?? 0,
      phase: partial.phase ?? 0,
      simplicity: partial.simplicity ?? 50, // 0 complex … 100 simple/sparse
      _flash: 0,
      _nextHitTransport: null,
      _beatIndex: 0,
      _lastHitAt: -999,
    };
  }

  function resetVoiceSchedulers() {
    state.voices.forEach((v) => {
      v._nextHitTransport = null;
      v._beatIndex = 0;
    });
  }

  const PRESETS = {
    "Session Ready": () => ({
      bpm: 48,
      useBpm: true,
      masterSimplicity: 74,
      reverbWet: 0.50,
      delayWet: 0.24,
      evolve: true,
      evolveRate: 0.08,
      visualMode: "pendulum",
      quadraticLength: true,
      voices: [
        { name: "High", beatsInCycle: 5, note: "G4", waveform: "bell", volume: 0.18, simplicity: 78, pan: 0.40, color: COLORS[0] },
        { name: "Mid", beatsInCycle: 3, note: "D4", waveform: "sine", volume: 0.30, simplicity: 72, pan: -0.25, color: COLORS[2] },
        { name: "Low", beatsInCycle: 2, note: "G3", waveform: "pad", volume: 0.34, simplicity: 80, pan: 0.20, color: COLORS[1] },
        { name: "Floor", beatsInCycle: 1, note: "G2", waveform: "sine", volume: 0.38, simplicity: 88, pan: 0, color: COLORS[6] },
      ],
    }),
    "3:2 classic": () => ({
      bpm: 72,
      useBpm: true,
      masterSimplicity: 45,
      reverbWet: 0.3,
      delayWet: 0.18,
      evolve: false,
      voices: [
        { name: "3", beatsInCycle: 3, note: "G3", waveform: "sine", volume: 0.55, simplicity: 40, color: COLORS[0] },
        { name: "2", beatsInCycle: 2, note: "C3", waveform: "triangle", volume: 0.5, simplicity: 50, color: COLORS[1], pan: -0.2 },
      ],
    }),
    "5:4": () => ({
      bpm: 66,
      useBpm: true,
      masterSimplicity: 40,
      reverbWet: 0.35,
      delayWet: 0.2,
      evolve: false,
      voices: [
        { name: "5", beatsInCycle: 5, note: "E4", waveform: "bell", volume: 0.4, simplicity: 35, color: COLORS[2] },
        { name: "4", beatsInCycle: 4, note: "A3", waveform: "sine", volume: 0.5, simplicity: 45, color: COLORS[3], pan: 0.25 },
      ],
    }),
    "Space Pendulum": () => ({
      bpm: 46,
      useBpm: true,
      masterSimplicity: 68,
      reverbWet: 0.48,
      delayWet: 0.22,
      evolve: true,
      evolveRate: 0.10,
      visualMode: "pendulum",
      quadraticLength: true,
      voices: [
        { name: "Tiny", beatsInCycle: 11, note: "E5", waveform: "sine", volume: 0.22, simplicity: 55, pan: -0.55, color: COLORS[0] },
        { name: "Small", beatsInCycle: 9, note: "B4", waveform: "triangle", volume: 0.26, simplicity: 60, pan: -0.30, color: COLORS[2] },
        { name: "Mid", beatsInCycle: 7, note: "E4", waveform: "bell", volume: 0.30, simplicity: 65, pan: 0.05, color: COLORS[1] },
        { name: "Large", beatsInCycle: 5, note: "A3", waveform: "pad", volume: 0.34, simplicity: 72, pan: 0.35, color: COLORS[4] },
        { name: "Deep", beatsInCycle: 3, note: "E2", waveform: "sine", volume: 0.42, simplicity: 78, pan: 0, color: COLORS[6] },
        { name: "Bass", beatsInCycle: 2, note: "A1", waveform: "kick", volume: 0.28, simplicity: 85, pan: 0, pitchMode: "hz", hz: 55, color: COLORS[7] },
      ],
    }),
    "Hammer Waves": () => ({
      bpm: 50,
      useBpm: true,
      masterSimplicity: 70,
      reverbWet: 0.52,
      delayWet: 0.26,
      evolve: true,
      evolveRate: 0.09,
      visualMode: "waves",
      voices: [
        { name: "Wave 1", beatsInCycle: 8, note: "D4", waveform: "sine", volume: 0.28, simplicity: 62, pan: -0.45, color: COLORS[0] },
        { name: "Wave 2", beatsInCycle: 7, note: "A3", waveform: "triangle", volume: 0.30, simplicity: 66, pan: -0.15, color: COLORS[5] },
        { name: "Wave 3", beatsInCycle: 6, note: "F3", waveform: "pad", volume: 0.32, simplicity: 70, pan: 0.15, color: COLORS[1] },
        { name: "Wave 4", beatsInCycle: 5, note: "D3", waveform: "sine", volume: 0.34, simplicity: 74, pan: 0.45, color: COLORS[3] },
