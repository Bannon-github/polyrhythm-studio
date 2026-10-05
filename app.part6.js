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
    "Harmonic Ladder": () => ({
      bpm: 40,
      useBpm: true,
      masterSimplicity: 70,
      reverbWet: 0.46,
      delayWet: 0.18,
      evolve: false,
      visualMode: "gate",
      voices: [
        { name: "H1", pathId: "h1", pathKind: "line", beatsInCycle: 1, note: "C2", waveform: "pad", volume: 0.30, simplicity: 84, pan: 0, phase: 0 },
        { name: "H2", pathId: "h2", pathKind: "line", beatsInCycle: 2, note: "C3", waveform: "sine", volume: 0.22, simplicity: 80, pan: -0.15, phase: 0.03 },
        { name: "H3", pathId: "h3", pathKind: "line", beatsInCycle: 3, note: "G3", waveform: "sine", volume: 0.18, simplicity: 78, pan: 0.12, phase: 0.06 },
        { name: "H4", pathId: "h4", pathKind: "line", beatsInCycle: 4, note: "C4", waveform: "bell", volume: 0.12, simplicity: 76, pan: 0.2, phase: 0.09 },
      ],
    }),
    "Soft Fifth": () => ({
      bpm: 44,
      useBpm: true,
      masterSimplicity: 72,
      reverbWet: 0.40,
      delayWet: 0.16,
      evolve: false,
      visualMode: "gate",
      voices: [
        { name: "Root", pathId: "root", pathKind: "circle", beatsInCycle: 2, note: "G3", waveform: "sine", volume: 0.26, simplicity: 82, pan: -0.12, phase: 0 },
        { name: "Fifth", pathId: "fifth", pathKind: "circle", beatsInCycle: 3, note: "D4", waveform: "sine", volume: 0.18, simplicity: 80, pan: 0.16, phase: 0.08 },
      ],
    }),
    "Just Third": () => ({
      bpm: 46,
      useBpm: true,
      masterSimplicity: 68,
      reverbWet: 0.38,
      delayWet: 0.14,
      evolve: false,
      visualMode: "gate",
      voices: [
        { name: "Fourth", pathId: "p4", pathKind: "square", beatsInCycle: 4, note: "C4", waveform: "sine", volume: 0.22, simplicity: 76, pan: -0.1, phase: 0 },
        { name: "Fifth-beat", pathId: "p5", pathKind: "square", beatsInCycle: 5, note: "E4", waveform: "bell", volume: 0.14, simplicity: 74, pan: 0.14, phase: 0.05 },
      ],
    }),
    "Orbital": () => ({
      bpm: 42,
      useBpm: true,
      masterSimplicity: 66,
      reverbWet: 0.48,
      delayWet: 0.20,
      evolve: false,
      visualMode: "gate",
      voices: [
        { name: "Four", pathId: "o4", pathKind: "circle", beatsInCycle: 4, note: "C3", waveform: "sine", volume: 0.24, simplicity: 74, pan: -0.2, phase: 0 },
        { name: "Five", pathId: "o5", pathKind: "circle", beatsInCycle: 5, note: "E3", waveform: "sine", volume: 0.18, simplicity: 72, pan: 0.05, phase: 0.09 },
        { name: "Six", pathId: "o6", pathKind: "circle", beatsInCycle: 6, note: "G3", waveform: "bell", volume: 0.14, simplicity: 70, pan: 0.22, phase: 0.17 },
      ],
    }),
    "Pendulum Chord": () => ({
      bpm: 36,
      useBpm: true,
      masterSimplicity: 74,
      reverbWet: 0.52,
      delayWet: 0.18,
      evolve: false,
      visualMode: "gate",
      voices: [
        { name: "P5", pathId: "p5", pathKind: "line", beatsInCycle: 5, note: "C3", waveform: "sine", volume: 0.20, simplicity: 80, pan: -0.24, phase: 0 },
        { name: "P6", pathId: "p6", pathKind: "line", beatsInCycle: 6, note: "D3", waveform: "sine", volume: 0.16, simplicity: 80, pan: -0.1, phase: 0.02 },
        { name: "P7", pathId: "p7", pathKind: "line", beatsInCycle: 7, note: "E3", waveform: "triangle", volume: 0.14, simplicity: 78, pan: 0.02, phase: 0.04 },
        { name: "P8", pathId: "p8", pathKind: "line", beatsInCycle: 8, note: "G3", waveform: "sine", volume: 0.12, simplicity: 78, pan: 0.12, phase: 0.06 },
        { name: "P9", pathId: "p9", pathKind: "line", beatsInCycle: 9, note: "A3", waveform: "bell", volume: 0.10, simplicity: 76, pan: 0.24, phase: 0.08 },
      ],
    }),
    "Twin Fifth": () => ({
      bpm: 50,
      useBpm: true,
      masterSimplicity: 70,
      reverbWet: 0.36,
      delayWet: 0.12,
      evolve: false,
      visualMode: "gate",
      voices: [
        { name: "Root", pathId: "root", pathKind: "line", beatsInCycle: 2, note: "G3", waveform: "pad", volume: 0.24, simplicity: 82, pan: 0, phase: 0 },
        { name: "Fifth A", pathId: "fifth", pathKind: "line", beatsInCycle: 3, note: "D4", waveform: "sine", volume: 0.15, simplicity: 78, pan: -0.18, phase: 0 },
        { name: "Fifth B", pathId: "fifth", pathKind: "line", beatsInCycle: 3, note: "D4", waveform: "sine", volume: 0.15, simplicity: 78, pan: 0.18, phase: 0.25 },
      ],
    }),
    "Circular Rhythm": () => {
      const base = 240 / 48;
      const notes = ["E4", "C4", "G3", "E3", "C3", "C2", "C2", "C2"];
      return {
        bpm: 48,
        useBpm: true,
        masterSimplicity: 74,
        reverbWet: 0.42,
        delayWet: 0.16,
        evolve: false,
        evolveRate: 0.08,
        visualMode: "circular",
        voices: notes.map((note, i) => ({
          name: "Ring " + i,
          beatsInCycle: i + 1,
          usePeriod: true,
          periodSec: base * (i + 1),
          pitchMode: "note",
          note,
          pathKind: "circle",
          pathId: "ring-" + i,
          waveform: "sine",
          volume: 0.14 + (0.18 * i) / 7,
          simplicity: 80,
          phase: 0,
          pan: 0,
        })),
      };
    },
    // Lucid Rhythms — vertical bars. Visuals owns drawLucid; Audio owns pitches/harp.
    // Harmony: C major (C/E/G). Bars low→high left→right. Bass alternates C2 <-> G2.
    "Lucid Rhythms": () => {
      const notes = ["C2", "E2", "G2", "C3", "E3", "G3", "C4", "E4", "G4", "C5"];
      const base = 240 / 52;
      const voices = notes.map((note, i) => ({
        name: "Bar " + i,
        beatsInCycle: 3 + i,
        usePeriod: true,
        // Very slightly different speeds so crossings drift (clip idea).
        periodSec: base * (1 + i * 0.041),
        pitchMode: "note",
        note,
        pathKind: "bar",
        pathId: "lucid-" + i,
        waveform: "harp",
        volume: 0.2 + (0.08 * (i % 5)) / 4,
        simplicity: 78,
        phase: (i * 0.07) % 1,
        pan: -0.45 + (i / 9) * 0.9,
        color: COLORS[i % COLORS.length],
      }));
      // Optional bass voice Visuals can leave silent or call via onGateSideSample.
      // Hits alternate C2 <-> G2 inside playLucidBassTone (role bass / pathId lucid-bass).
      voices.push({
        name: "Bass",
        role: "bass",
        beatsInCycle: 1,
        usePeriod: true,
        periodSec: base * 2.6,
        pitchMode: "note",
        note: "C2",
        pathKind: "bar",
        pathId: "lucid-bass",
        waveform: "kick",
        volume: 0.4,
        simplicity: 88,
        phase: 0,
        pan: 0,
        mute: true,
        color: COLORS[6],
      });
      return {
        bpm: 52,
        useBpm: true,
        masterSimplicity: 76,
        reverbWet: 0.48,
        delayWet: 0.2,
        evolve: false,
        evolveRate: 0.06,
        visualMode: "lucid",
        voices,
      };
    },
    // Nested Triangles — nested steps inside a large triangle. Visuals owns draw.
    // Chord: Am (A/C/E bank notes only). Chime on outer edge only.
    "Nested Triangles": () => {
      const notes = ["A4", "C4", "E4", "A3", "C3", "E3", "A2"];
      const base = 240 / 46;
      const voices = notes.map((note, i) => ({
        name: "Tri " + i,
        beatsInCycle: 2 + i,
        usePeriod: true,
        // Related periods so steps pulse in sequence (inner faster, outer slower).
        periodSec: base * (1 + i * 0.11),
        pitchMode: "note",
        note,
        pathKind: "triangle",
        pathId: "tri-" + i,
        waveform: "chime",
        volume: 0.18 + (0.1 * (i % 4)) / 3,
        simplicity: 76,
        phase: (i * 0.09) % 1,
        pan: -0.4 + (i / Math.max(1, notes.length - 1)) * 0.8,
        color: COLORS[i % COLORS.length],
      }));
      return {
        bpm: 46,
        useBpm: true,
        masterSimplicity: 74,
        reverbWet: 0.44,
        delayWet: 0.18,
        evolve: false,
        evolveRate: 0.06,
        visualMode: "triangles",
        voices,
      };
    },
  };

  // Circular Rhythm. One note per ring, index 0 innermost / highest.
  // Only sample-bank notes, so connectGateSample plays the wav at rate 1.
  // Real chords, index 0 = innermost / highest. Bank notes only.
  // Outer rings repeat the lowest chord tone so pitch never rises.
  const CIRC_PROGRESSIONS = ["C", "Am", "Em", "G5", "D5", "C5"];
  const CIRC_PROGRESSION_LABEL = { C: "C", Am: "Am", Em: "Em", G5: "G5", D5: "D5", C5: "C5" };
  const CIRC_LEGACY = { open: "C", turnaround: "Am", fifths: "G5" };
  const CIRC_CHORDS = {
    C:  ["E4", "C4", "G3", "E3", "C3", "C2", "C2", "C2"],
    Am: ["E4", "C4", "A3", "E3", "C3", "C2", "C2", "C2"],
    Em: ["E4", "G3", "E3", "E3", "E3", "E3", "E3", "E3"],
    G5: ["D4", "G3", "D3", "D3", "D3", "D3", "D3", "D3"],
    D5: ["D4", "A3", "D3", "D3", "D3", "D3", "D3", "D3"],
    C5: ["C4", "G3", "C3", "C2", "C2", "C2", "C2", "C2"],
  };
  function circNormalizeProgression(p) {
    if (CIRC_CHORDS[p]) return p;
    if (CIRC_LEGACY[p]) return CIRC_LEGACY[p];
    return "C";
  }

  function circularRhythmPeriod() {
    return 240 / Math.max(20, state.bpm);
  }

  // Shared orbital speed, not a shared period. Radius grows as (index + 1),
  // so the lap time does too. Ring 0 is the inner lap. Phase stays 0.
  function circularRingPeriod(i) {
    return circularRhythmPeriod() * ((i | 0) + 1);
  }

  function circularRhythmVolume(i) {
    return 0.14 + (0.18 * i) / 7;
  }

  function circularRhythmFullNotes(progression, chordIndex) {
    return CIRC_CHORDS[circNormalizeProgression(progression)];
  }

  function circularMachineLive() {
    return state.visualMode === "circular" && state.activePreset === "Circular Rhythm" && !!state.circularRhythm;
  }

  function publishCircularRhythm(progression, chordIndex, ringCount) {
    const full = circularRhythmFullNotes(progression, chordIndex);
    const notes = full.slice(0, ringCount);
    const progIndex = Math.max(0, CIRC_PROGRESSIONS.indexOf(progression));
    state.circularRhythm = {
      progression: progression,
      chordIndex: chordIndex,
      ringCount: ringCount,
      notes: notes.slice(),
    };
    state.circularRings = ringCount;
    state.circularChord = progIndex;
  }

  // Retarget in place. Rings that stay keep _gateSideSeen.
  // The drawer's ensure step rebuilds whenever there are fewer than 3 voices,
  // which would wipe the side and the notes. Below 3, the extra slots stay in
  // the list muted so only ringCount is heard. circularRings stays the real count.
  function installCircularVoices(progression, chordIndex, ringCount) {
    ringCount = Math.max(1, Math.min(8, ringCount | 0));
    const full = circularRhythmFullNotes(progression, chordIndex);
    const slots = Math.max(ringCount, 3);
    while (state.voices.length > slots) state.voices.pop();
    for (let i = 0; i < slots; i++) {
      const audible = i < ringCount;
      const fields = {
        name: "Ring " + i,
        note: full[i],
        volume: circularRhythmVolume(i),
        pathKind: "circle",
        pathId: "ring-" + i,
        waveform: "sine",
        pitchMode: "note",
        phase: 0,
        usePeriod: true,
        periodSec: circularRingPeriod(i),
        beatsInCycle: i + 1,
        mute: !audible,
      };
      if (state.voices[i]) {
        const staying = audible && state.voices[i].pathId === "ring-" + i && !state.voices[i].mute;
        Object.assign(state.voices[i], fields);
        if (!staying) state.voices[i]._gateSideSeen = null;
        publishPitchHint(state.voices[i]);
      } else {
        state.voices.push(makeVoice(fields));
      }
    }
    publishCircularRhythm(progression, chordIndex, ringCount);
  }

  // Chord change: note only. No hit, and the remembered side stays.
  function touchCircularNotesOnly(progression, chordIndex) {
    const n = Math.max(1, Math.min(8, (state.circularRhythm && state.circularRhythm.ringCount) || state.voices.length || 1));
    const full = circularRhythmFullNotes(progression, chordIndex);
    for (let i = 0; i < n && i < state.voices.length; i++) {
      if (state.voices[i].note !== full[i]) {
        state.voices[i].note = full[i];
        publishPitchHint(state.voices[i]);
      }
    }
    publishCircularRhythm(progression, chordIndex, n);
  }

  function advanceCircularTurnaround() {
    const cr = state.circularRhythm;
    if (!cr || cr.progression !== "turnaround") return;
    if (!circularMachineLive()) return;
    const bar = circularRhythmPeriod();
    const idx = Math.floor(transportTime() / bar) % 3;
    if (idx === cr.chordIndex) return;
    touchCircularNotesOnly("turnaround", idx);
    if (typeof renderVoiceList === "function") renderVoiceList();
  }

  // ----- Lucid Rhythms (mode "lucid") -----
  // C major only: bars are C/E/G chord tones; bass alternates C2 <-> G2.
  // Visuals owns the ten-bar draw. Audio owns pitches / periods / harp.
  // BOTTOM LINE ONLY (every bar / voice): sound fires solely when a rectangle
  // meets the bottom hit line. Tops and other edges stay silent.
  // Visuals: onGateSideSample(v, +1) at bottom; never playVoiceHit on top bounce.
  // Audio also ignores Lucid flips to side -1. Bass C2<->G2 advances only then.
  // Index 0 = leftmost / lowest. Index 9 = rightmost / highest.
  const LUCID_BAR_NOTES = ["C2", "E2", "G2", "C3", "E3", "G3", "C4", "E4", "G4", "C5"];

  function lucidBarPeriod(i) {
    const base = 240 / Math.max(20, state.bpm);
    return base * (1 + (i | 0) * 0.041);
  }

  function publishLucidRhythm() {
    const notes = LUCID_BAR_NOTES.slice();
    state.lucidRhythm = {
      chord: "C",
      barCount: notes.length,
      notes: notes,
      bassNotes: (typeof LUCID_BASS_NOTES !== "undefined" ? LUCID_BASS_NOTES.slice() : ["C2", "G2"]),
    };
  }

  // Retarget in place so dials can refresh periods without wiping _gateSideSeen.
  // Callers that jump phase/tempo should quietCrossings() first.
  function installLucidVoices() {
    const notes = LUCID_BAR_NOTES;
    const n = notes.length;
    const fieldsFor = (i) => ({
      name: "Bar " + i,
      note: notes[i],
      volume: 0.2 + (0.08 * (i % 5)) / 4,
      pathKind: "bar",
      pathId: "lucid-" + i,
      role: "",
      waveform: "harp",
      pitchMode: "note",
      phase: (i * 0.07) % 1,
      usePeriod: true,
      periodSec: lucidBarPeriod(i),
      beatsInCycle: 3 + i,
      mute: false,
      pan: -0.45 + (i / 9) * 0.9,
      color: COLORS[i % COLORS.length],
    });
    const bassFields = {
      name: "Bass",
      role: "bass",
      note: "C2",
      volume: 0.4,
      pathKind: "bar",
      pathId: "lucid-bass",
      waveform: "kick",
      pitchMode: "note",
      phase: 0,
      usePeriod: true,
      periodSec: lucidBarPeriod(0) * 2.6,
      beatsInCycle: 1,
      mute: true,
      pan: 0,
      color: COLORS[6],
    };
    const slots = n + 1; // 10 harp bars + muted bass slot
    while (state.voices.length > slots) state.voices.pop();
    for (let i = 0; i < n; i++) {
      const fields = fieldsFor(i);
      if (state.voices[i]) {
        const staying = state.voices[i].pathId === "lucid-" + i && !state.voices[i].mute;
        Object.assign(state.voices[i], fields);
        if (!staying) state.voices[i]._gateSideSeen = null;
        publishPitchHint(state.voices[i]);
      } else {
        state.voices.push(makeVoice(fields));
      }
    }
    const bi = n;
    if (state.voices[bi]) {
      Object.assign(state.voices[bi], bassFields);
      publishPitchHint(state.voices[bi]);
    } else {
      state.voices.push(makeVoice(bassFields));
    }
    publishLucidRhythm();
    if (typeof renderVoiceList === "function") renderVoiceList();
  }

  // ----- Nested Triangles (mode "triangles") -----
  // Am chord tones only (A/C/E). pathIds tri-0..tri-6 (inner → outer).
  // Visuals owns the nested-triangle draw. Audio owns pitches / periods / chime.
  // OUTER EDGE ONLY: Visuals calls onGateSideSample(v, +1) when a step meets the
  // outer edge of the large triangle; never on inner edges or return path.
  // Audio ignores triangles flips to -1 (latch only). schedule() never invents hits.
  const TRIANGLE_STEP_NOTES = ["A4", "C4", "E4", "A3", "C3", "E3", "A2"];

  function triangleStepPeriod(i) {
    const base = 240 / Math.max(20, state.bpm);
    return base * (1 + (i | 0) * 0.11);
  }

  function publishTriangleRhythm() {
    const notes = TRIANGLE_STEP_NOTES.slice();
    state.triangleRhythm = {
      chord: "Am",
      stepCount: notes.length,
      notes: notes,
    };
  }

  // Retarget in place so dials can refresh periods without wiping _gateSideSeen.
  // Callers that jump phase/tempo should quietCrossings() first.
  function installTriangleVoices() {
    const notes = TRIANGLE_STEP_NOTES;
    const n = notes.length;
    const fieldsFor = (i) => ({
      name: "Tri " + i,
      note: notes[i],
      volume: 0.18 + (0.1 * (i % 4)) / 3,
      pathKind: "triangle",
      pathId: "tri-" + i,
      role: "",
      waveform: "chime",
      pitchMode: "note",
      phase: (i * 0.09) % 1,
      usePeriod: true,
      periodSec: triangleStepPeriod(i),
      beatsInCycle: 2 + i,
      mute: false,
      pan: -0.4 + (i / Math.max(1, n - 1)) * 0.8,
      color: COLORS[i % COLORS.length],
    });
    while (state.voices.length > n) state.voices.pop();
    for (let i = 0; i < n; i++) {
      const fields = fieldsFor(i);
      if (state.voices[i]) {
        const staying = state.voices[i].pathId === "tri-" + i && !state.voices[i].mute;
        Object.assign(state.voices[i], fields);
        if (!staying) state.voices[i]._gateSideSeen = null;
        publishPitchHint(state.voices[i]);
      } else {
        state.voices.push(makeVoice(fields));
      }
    }
    publishTriangleRhythm();
    if (typeof renderVoiceList === "function") renderVoiceList();
  }

  function applyPreset(name) {
    const factory = PRESETS[name];
    if (!factory) return;
    state.activePreset = name;
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
    state.voices.forEach(publishPitchHint);
    if (name === "Circular Rhythm") publishCircularRhythm("C", 0, state.voices.length);
    if (name === "Lucid Rhythms") {
      lucidBarHitCount = 0;
      lucidBassHitCount = 0;
      publishLucidRhythm();
    }
    if (name === "Nested Triangles") {
      publishTriangleRhythm();
    }
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
