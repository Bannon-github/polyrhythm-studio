    } else if (role > 0.62) {
      f.type = "highpass";
      f.frequency.setValueAtTime(90 + (role - 0.62) * 520, when); // mild air clear
      f.Q.value = 0.45;
    } else {
      f.type = "lowpass";
      f.frequency.setValueAtTime(5200 + role * 800, when); // mostly open mids
      f.Q.value = 0.4;
    }
    return f;
  }

  function initAudio() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = state.masterVolume;

    // Soft saturation → soft limiter on master bus (before destination)
    softSat = ctx.createWaveShaper();
    softSat.curve = makeSoftSatCurve(0.28);
    softSat.oversample = "2x";

    softLimiter = ctx.createDynamicsCompressor();
    softLimiter.threshold.value = -6;
    softLimiter.knee.value = 12;
    softLimiter.ratio.value = 8;
    softLimiter.attack.value = 0.005;
    softLimiter.release.value = 0.18;

    dryGain = ctx.createGain();
    dryGain.gain.value = 1;

    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse();
    reverbGain = ctx.createGain();
    reverbGain.gain.value = state.reverbWet;

    delayNode = ctx.createDelay(1.5);
    delayNode.delayTime.value = 0.5;
    const delayFb = ctx.createGain();
    delayFb.gain.value = 0.4;
    delayGain = ctx.createGain();
    delayGain.gain.value = state.delayWet;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = "lowpass";
    delayFilter.frequency.value = 2000;

    delayNode.connect(delayFb);
    delayFb.connect(delayFilter);
    delayFilter.connect(delayNode);
    delayNode.connect(delayGain);

    // Mix bus → masterGain → soft sat → soft limiter → destination
    dryGain.connect(masterGain);
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);
    delayGain.connect(masterGain);
    masterGain.connect(softSat);
    softSat.connect(softLimiter);
    softLimiter.connect(ctx.destination);

    // also feed delay/reverb from dry path via send
    dryGain.connect(convolver);
    dryGain.connect(delayNode);

    state.audioReady = true;
  }

  function voicePeriodSec(v) {
    // Period from beat count relative to master cycle, or explicit period
    if (v.usePeriod) return Math.max(0.15, v.periodSec);
    const cycle = state.useBpm
      ? (60 / Math.max(20, state.bpm)) * Math.max(1, v.beatsInCycle || 1)
      : state.masterCycleSec / Math.max(1, v.beatsInCycle || 1);
    // When using BPM mode with beatsInCycle = N, period = (60/bpm) * (masterBeats/N)... 
    // Simpler: beatsInCycle means how many hits fit in the master cycle.
    // period = masterCycle / beatsInCycle
    const master = state.useBpm ? (240 / Math.max(20, state.bpm)) : state.masterCycleSec;
    // 4 bars at bpm as default master feel, or masterCycleSec
    const masterLen = state.useBpm ? (60 / state.bpm) * 16 : state.masterCycleSec;
    return Math.max(0.12, masterLen / Math.max(1, v.beatsInCycle));
  }

  function effectiveSimplicity(v) {
    // Blend master + per-voice; 100 = sparsest / simplest
    const m = state.masterSimplicity / 100;
    const local = (v.simplicity ?? 50) / 100;
    return Math.min(1, Math.max(0, local * 0.7 + m * 0.3));
  }

  /**
   * Simplicity gates hits:
   * - High simplicity → fewer subdivisions fire (only every Nth beat)
   * - Softens amplitude slightly for sparse feel
   * Returns { fire: bool, densityGain: number, subIndex used }
   */
  function shouldFireHit(v, beatIndex) {
    const s = effectiveSimplicity(v);
    // At simplicity 0: every beat. At 100: only every 4th+ beat (sparse lullaby)
    const skip = 1 + Math.floor(s * 3.2); // 1..4
    const phaseBias = Math.floor(s * 2); // prefer early beats in cycle when simple
    const inCycle = beatIndex % Math.max(1, Math.round(v.beatsInCycle) || 1);
    if (beatIndex % skip !== 0) return { fire: false, densityGain: 0 };
    // Extra thinning: at high simplicity, drop odd "busy" hits in the cycle
