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

  // gateSamples: nearest bank note by log frequency. Exact prefix notes land at
  // playbackRate 1 because hz is NOTE_FREQ. Rates outside 0.8–1.25 are not stretched.
  // Returns the stop offset in seconds, or 0 when the hit should use the oscillator.
  function connectGateSample(g, now, vol, freq) {
    let best = null;
    let bestD = Infinity;
    for (const note in gateSamples) {
      const s = gateSamples[note];
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

  function playVoiceHit(v, when, densityGain = 1) {
    if (v.mute || !ctx) return;
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

    // sine, triangle, bell, pad: the gateSamples buffer replaces the oscillator.
    // noise and kick stay below. saw and square stay on the oscillator branch.
    let sampleStop = 0;
    if (wave === "sine" || wave === "triangle" || wave === "bell" || wave === "pad") {
      sampleStop = connectGateSample(g, now, vol, freq);
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
      const partials = [1, 2.76, 5.4, 8.2];
      const gains = [1, 0.45, 0.22, 0.1];
      const bellDur = 2.15;
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
      g.gain.linearRampToValueAtTime(vol * 0.52, now + 0.028);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      srcEnd = now + bellDur;
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
