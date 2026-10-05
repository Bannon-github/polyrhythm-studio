    if (s > 0.55 && inCycle % 2 === 1 && (inCycle + phaseBias) % 3 !== 0) {
      return { fire: false, densityGain: 0 };
    }
    if (s > 0.8 && inCycle !== 0 && Math.random() < s * 0.4) {
      return { fire: false, densityGain: 0 };
    }
    const densityGain = 1 - s * 0.25;
    return { fire: true, densityGain };
  }

  function resolveFreq(v) {
    if (v.pitchMode === "note") return NOTE_FREQ[v.note] || 220;
    return Math.max(20, Math.min(4000, v.hz));
  }

  // Nearest note in one bank by log frequency. Exact bank notes land at
  // playbackRate 1 because hz is NOTE_FREQ. Rates outside 0.8–1.25 are not stretched.
  // bank is either gateSamples or cubeSamples, never both.
  // Returns the stop offset in seconds, or 0 when the hit should use the oscillator.
  function connectGateSample(g, now, vol, freq, bank) {
    if (!bank) return 0;
    let best = null;
    let bestD = Infinity;
    for (const note in bank) {
      const s = bank[note];
      if (!s || !s.buffer || !(s.hz > 0)) continue;
      const d = Math.abs(Math.log(freq / s.hz));
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (!best) return 0;
    const rate = freq / best.hz;
    if (!(rate >= 0.8 && rate <= 1.25)) return 0;
    const src = ctx.createBufferSource();
    src.buffer = best.buffer;
    src.playbackRate.setValueAtTime(rate, now);
    src.connect(g);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.004);
    const stopAt = best.buffer.duration / rate + 0.02;
    src.start(now);
    src.stop(now + stopAt);
    return stopAt;
  }

  // Lucid Rhythms bass: C major root/fifth an octave below the bars.
  // Alternates exactly C2 <-> G2 on successive bass hits (not random, not fixed).
  // Only advances on bottom-line meetings (onGateSideSample Lucid side===+1).
  // Fired (a) when playVoiceHit lands on role==="bass" / pathId lucid-bass*, or
  // (b) as a sparse side-chain from lucid bar harp hits (every LUCID_BASS_EVERY-th).
  const LUCID_BASS_NOTES = ["C2", "G2"];
  const LUCID_BASS_EVERY = 7;
  let lucidBassHitCount = 0;
  let lucidBarHitCount = 0;

  function isLucidBassVoice(v) {
    if (!v) return false;
    if (v.role === "bass") return true;
    const id = String(v.pathId || "");
    return id === "lucid-bass" || id.indexOf("lucid-bass") === 0;
  }

  function isLucidBarVoice(v) {
    if (!v) return false;
    const id = String(v.pathId || "");
    return /^lucid-\d+$/.test(id);
  }

  // Warm short sub + sine thump. Own bus; does not touch gate/cube sample banks.
  // Alternates LUCID_BASS_NOTES on each call. Bank notes only (C2 / G2).
  function playLucidBassTone(when, densityGain = 1, pan = 0, volume = 0.42) {
    if (!ctx || !dryGain) return;
    const note = LUCID_BASS_NOTES[lucidBassHitCount % 2];
    lucidBassHitCount += 1;
    const freq = NOTE_FREQ[note] || 65.41;
    const now = when;
    const vol = volume * densityGain;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(180, now);
    lp.Q.value = 0.7;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    g.connect(lp);
    if (panner) {
      panner.pan.setValueAtTime(pan, now);
      lp.connect(panner);
      panner.connect(dryGain);
    } else {
      lp.connect(dryGain);
    }
    // Body sine
    const body = ctx.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(freq * 1.35, now);
    body.frequency.exponentialRampToValueAtTime(Math.max(28, freq * 0.92), now + 0.16);
    body.connect(g);
    // Soft sub an octave below
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(Math.max(28, freq * 0.5), now);
    const sg = ctx.createGain();
    sg.gain.value = 0.55;
    sub.connect(sg);
    sg.connect(g);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol * 0.72, now + 0.018);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    body.start(now);
    body.stop(now + 0.6);
    sub.start(now);
    sub.stop(now + 0.6);
  }

  function playVoiceHit(v, when, densityGain = 1) {
    if (v.mute || !ctx) return;

    // Lucid bass voice: alternating C2/G2 thump only. Never samples, never harp.
    if (isLucidBassVoice(v)) {
      playLucidBassTone(when, densityGain, v.pan ?? 0, v.volume ?? 0.42);
      v._flash = 1;
      v._lastHitAt = transportTime();
      return;
    }

    const freq = resolveFreq(v);
    const vol = (v.volume ?? 0.6) * densityGain;
    const pan = v.pan ?? 0;
    const wave = v.waveform || "sine";

    const g = ctx.createGain();
    const tone = voiceRoleTone(v, when);
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    // amp → complementary tone filter → stereo pan → dry bus
    g.connect(tone);
    if (panner) {
      panner.pan.setValueAtTime(pan, when);
      tone.connect(panner);
      panner.connect(dryGain);
    } else {
      tone.connect(dryGain);
    }

    const now = when;
    let srcEnd = now + 1.2;

    // sine, triangle, bell, pad: one sample bank replaces the oscillator.
    // Cube faces use the wood-block map. Gate and Circular stay on the mallets.
    // harp and chime stay generative (never gateSamples / cubeSamples).
    // noise and kick stay below. saw and square stay on the oscillator branch.
    let sampleStop = 0;
    if (wave === "sine" || wave === "triangle" || wave === "bell" || wave === "pad") {
      const cubeHit = state.visualMode === "cubes" || String(v.pathId || "").indexOf("cube-") === 0;
      if (cubeHit) sampleStop = connectGateSample(g, now, vol, freq, cubeSamples);
      else sampleStop = connectGateSample(g, now, vol, freq, gateSamples);
    }

    if (sampleStop > 0) {
      srcEnd = now + sampleStop;
    } else if (wave === "noise") {
      const len = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = 0.8;
      src.connect(bp);
      bp.connect(g);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * 0.45, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      src.start(now);
      src.stop(now + 0.22);
      srcEnd = now + 0.22;
    } else if (wave === "kick") {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 1.8, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.45), now + 0.12);
      osc.connect(g);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * 0.9, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.34);
      srcEnd = now + 0.34;
    } else if (wave === "bell") {
      // Refined FM-ish additive bell (still long / glassy). Lucid bars default to harp instead.
      const partials = [1, 2.76, 5.4, 8.21, 11.1];
      const gains = [1, 0.42, 0.2, 0.09, 0.04];
      const bellDur = 2.05;
      partials.forEach((p, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freq * p;
        const pg = ctx.createGain();
        pg.gain.value = gains[i];
        o.connect(pg);
        pg.connect(g);
        o.start(now);
        o.stop(now + bellDur);
      });
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * 0.5, now + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
      srcEnd = now + bellDur;
    } else if (wave === "harp") {
      // Live plucked harp: short bright attack, decaying additive partials.
      // Not the long FM bell, not mallet samples, not wood block.
      const partials = [1, 2, 3, 4.01, 5.04, 6.08, 7.12];
      const gains = [1, 0.52, 0.28, 0.16, 0.09, 0.05, 0.025];
      const harpDur = 1.12;
      partials.forEach((p, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freq * p;
        const pg = ctx.createGain();
        const pDur = Math.max(0.1, harpDur * (1 - i * 0.11));
        pg.gain.setValueAtTime(0, now);
        pg.gain.linearRampToValueAtTime(gains[i], now + 0.003);
        pg.gain.exponentialRampToValueAtTime(0.001, now + pDur);
        o.connect(pg);
        pg.connect(g);
        o.start(now);
        o.stop(now + pDur + 0.04);
      });
      // Tiny pluck noise tick into the same amp
      const nLen = Math.floor(ctx.sampleRate * 0.03);
      const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
      const nd = nBuf.getChannelData(0);
      for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen);
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuf;
      const nBp = ctx.createBiquadFilter();
      nBp.type = "bandpass";
      nBp.frequency.value = Math.min(4200, freq * 3.2);
      nBp.Q.value = 1.2;
      const nG = ctx.createGain();
      nG.gain.setValueAtTime(vol * 0.22, now);
      nG.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
      nSrc.connect(nBp);
      nBp.connect(nG);
      nG.connect(g);
      nSrc.start(now);
      nSrc.stop(now + 0.035);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * 0.58, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      srcEnd = now + harpDur;
    } else if (wave === "chime") {
      // Soft metallic triangle-chime: muted glassy pluck, short step-readable decay.
      // Nested Triangles outer-edge hits. Not harp, not mallet, not wood-block.
      const partials = [1, 2.714, 5.405, 8.215];
      const gains = [1, 0.38, 0.16, 0.06];
      const chimeDur = 0.72;
      partials.forEach((p, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freq * p;
        const pg = ctx.createGain();
        const pDur = Math.max(0.08, chimeDur * (1 - i * 0.18));
        pg.gain.setValueAtTime(0, now);
        pg.gain.linearRampToValueAtTime(gains[i], now + 0.002);
        pg.gain.exponentialRampToValueAtTime(0.001, now + pDur);
        o.connect(pg);
        pg.connect(g);
        o.start(now);
        o.stop(now + pDur + 0.03);
      });
      // Tiny metallic tick
      const nLen = Math.floor(ctx.sampleRate * 0.018);
      const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
      const nd = nBuf.getChannelData(0);
      for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen);
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuf;
      const nHp = ctx.createBiquadFilter();
      nHp.type = "highpass";
      nHp.frequency.value = Math.min(6000, freq * 4.5);
      nHp.Q.value = 0.7;
      const nG = ctx.createGain();
      nG.gain.setValueAtTime(vol * 0.14, now);
      nG.gain.exponentialRampToValueAtTime(0.001, now + 0.016);
      nSrc.connect(nHp);
      nHp.connect(nG);
      nG.connect(g);
      nSrc.start(now);
      nSrc.stop(now + 0.02);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * 0.48, now + 0.003);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.62);
      srcEnd = now + chimeDur;
    } else if (wave === "pad") {
      [0, 0.02, -0.015].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = freq * (1 + det);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(freq * 2.5, now);
        f.frequency.linearRampToValueAtTime(freq * 4, now + 0.4);
        f.Q.value = 2;
        o.connect(f);
        f.connect(g);
        o.start(now);
        o.stop(now + 2.6);
      });
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * 0.28, now + 0.32);
      g.gain.linearRampToValueAtTime(vol * 0.18, now + 1.15);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
      srcEnd = now + 2.6;
    } else {
      const o = ctx.createOscillator();
      o.type = { sine: "sine", triangle: "triangle", saw: "sawtooth", square: "square" }[wave] || "sine";
      o.frequency.value = freq;
