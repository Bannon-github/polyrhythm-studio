/**
 * Polyrhythm Studio — generative ambient pendulum / wave music
 * Original Web Audio + Canvas app. Inspired by ambient polyrhythm visuals (not affiliated).
 */
(() => {
  "use strict";

  // ---------- Constants ----------
  const MAX_VOICES = 12;
  const LOOKAHEAD = 0.08;
  const SCHEDULE_AHEAD = 0.12;
  const NOTES = [
    "C1","D1","E1","F1","G1","A1","B1",
    "C2","D2","E2","F2","G2","A2","B2",
    "C3","D3","E3","F3","G3","A3","B3",
    "C4","D4","E4","F4","G4","A4","B4",
    "C5","D5","E5","F5","G5","A5","B5"
  ];
  const NOTE_FREQ = Object.fromEntries(
    NOTES.map((n) => {
      const m = n.match(/^([A-G])(\d)$/);
      const semis = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }[m[1]] + (Number(m[2]) + 1) * 12;
      return [n, 440 * Math.pow(2, (semis - 69) / 12)];
    })
  );
  const WAVEFORMS = ["sine","triangle","saw","square","noise","bell","kick","pad"];
  const COLORS = [
    "#7ec8ff", // cyan
    "#9b7cff", // violet
    "#6eb8ff", // cool cyan accent
    "#a890ff", // soft violet accent
    "#88d0ff",
    "#8a78ff",
    "#5eb0ff",
    "#b09cff"
  ];

  // ---------- State ----------
  const state = {
    playing: false,
    controlsHidden: true, // immersive: lab drawer collapsed by default
    visualMode: "pendulum", // pendulum | circular | linear | mandala | triangles | waves | sineRibbons
    quadraticLength: false, // pendulum length ∝ period²
    bpm: 48,
    masterCycleSec: 8,
    useBpm: true,
    masterVolume: 0.68,
    reverbWet: 0.50,
    delayWet: 0.24,
    evolve: false,
    evolveRate: 0.15, // intensity
    masterSimplicity: 74, // 0=complex, 100=very simple — scales voice simplicity
    voices: [],
    nextVoiceId: 1,
    audioReady: false,
  };

  // ---------- Audio ----------
  let ctx = null;
  let masterGain = null;
  let dryGain = null;
  let reverbGain = null;
  let delayGain = null;
  let delayNode = null;
  let convolver = null;
  let softSat = null;
  let softLimiter = null;
  let schedulerTimer = null;
  let transportStart = 0; // audio time when play began
  let visualOrigin = 0;   // performance.now() at play
  let pauseAccum = 0;
  let autoHideTimer = null;
  let lastSched = 0;

  function makeImpulse(seconds = 4.25, decay = 3.0) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    // Slight stereo decorrelation (~11–14ms) + soft onset → warmer hall, less clicky
    const decorSamples = Math.floor(rate * 0.0125);
    const attack = Math.max(1, Math.floor(rate * 0.01));
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      const offset = c === 0 ? 0 : decorSamples;
      for (let i = 0; i < len; i++) {
        const t = Math.max(0, i - offset);
        const env = Math.pow(1 - t / len, decay);
        const soft = t < attack ? t / attack : 1;
        d[i] = (Math.random() * 2 - 1) * env * soft * 0.85;
      }
    }
    return buf;
  }


  /** Gentle tanh-like drive curve for soft master saturation (ambient). */
  function makeSoftSatCurve(amount = 0.28) {
    const n = 2048;
    const curve = new Float32Array(n);
    const k = 1 + amount * 2.2;
    const norm = Math.tanh(k);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / (n - 1) - 1;
      curve[i] = Math.tanh(x * k) / norm;
    }
    return curve;
  }

  /**
   * Complementary per-voice tone shaping to reduce mud:
   * lower roles → more LPF; higher roles → slight HPF.
   */
  function voiceRoleTone(v, when) {
    const idx = Math.max(0, state.voices.indexOf(v));
    const n = Math.max(1, state.voices.length - 1);
    const roleIdx = idx / n;
    const freq = resolveFreq(v);
    const pitchNorm = Math.min(1, Math.max(0, (Math.log2(Math.max(40, freq) / 55)) / 6));
    const role = roleIdx * 0.55 + pitchNorm * 0.45;
    const f = ctx.createBiquadFilter();
    if (role < 0.38) {
      f.type = "lowpass";
      f.frequency.setValueAtTime(1400 + role * 3200, when); // ~1.4–2.6k
      f.Q.value = 0.65;
