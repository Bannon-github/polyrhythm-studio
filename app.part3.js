      o.connect(g);
      // Melodic attack ≥15–40ms; longer release for sine / soft waves
      const atk = wave === "square" ? 0.018 : wave === "saw" ? 0.022 : wave === "sine" ? 0.032 : 0.025;
      const baseRel = wave === "sine" ? 0.85 : 0.62;
      const rel = baseRel + (1 - effectiveSimplicity(v)) * 0.45;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol * 0.5, now + atk);
      g.gain.exponentialRampToValueAtTime(0.001, now + rel);
      o.start(now);
      o.stop(now + rel + 0.06);
      srcEnd = now + rel + 0.06;
    }

    // flash for visual
    v._flash = 1;
    v._lastHitAt = transportTime();
  }

  function transportTime() {
    if (!state.playing || !ctx) return pauseAccum;
    return pauseAccum + (ctx.currentTime - transportStart);
  }

  function schedule() {
    if (!state.playing || !ctx) return;
    const now = ctx.currentTime;
    const transportNow = pauseAccum + (now - transportStart);

    state.voices.forEach((v) => {
      if (v.mute) return;
      const period = voicePeriodSec(v);
      if (v._nextHitTransport == null) {
        const phase = (v.phase || 0) * period;
        const n = Math.max(0, Math.ceil((transportNow - phase) / period));
        v._nextHitTransport = n * period + phase;
        v._beatIndex = n;
      }
      while (v._nextHitTransport <= transportNow + SCHEDULE_AHEAD) {
        const whenAudio = transportStart + (v._nextHitTransport - pauseAccum);
        if (whenAudio >= now - 0.01) {
          const gate = shouldFireHit(v, v._beatIndex || 0);
          if (gate.fire) playVoiceHit(v, Math.max(whenAudio, now + 0.003), gate.densityGain);
        }
        v._beatIndex = (v._beatIndex || 0) + 1;
        v._nextHitTransport += period;
      }
    });
    lastSched = now;
  }

  function startScheduler() {
    stopScheduler();
    schedule();
    schedulerTimer = setInterval(schedule, LOOKAHEAD * 1000);
  }

  function stopScheduler() {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  // ---------- Evolve (ambient drift) ----------
  let evolveLast = 0;
  function evolveStep(dt) {
    if (!state.evolve) return;
    const rate = state.evolveRate;
    state.voices.forEach((v, i) => {
      const s = effectiveSimplicity(v);
      // Simpler voices drift less (more stable lullaby); complex drift more
      const amt = rate * (0.35 + (1 - s) * 0.9) * dt;
      if (v.pitchMode === "hz") {
        v.hz = Math.max(40, Math.min(1200, v.hz * (1 + (Math.sin(evolveLast * 0.07 + i) * 0.004 + (Math.random() - 0.5) * 0.002) * amt * 8)));
      } else {
        // occasional note nudge
        if (Math.random() < amt * 0.02) {
          const idx = NOTES.indexOf(v.note);
          if (idx >= 0) {
            const step = Math.random() < 0.5 ? -1 : 1;
            v.note = NOTES[Math.max(0, Math.min(NOTES.length - 1, idx + step))];
          }
        }
      }
      if (v.usePeriod) {
        v.periodSec = Math.max(0.2, Math.min(12, v.periodSec * (1 + Math.sin(evolveLast * 0.05 + i * 0.7) * 0.0015 * amt * 10)));
      } else if (Math.random() < amt * 0.008 && s < 0.7) {
        v.beatsInCycle = Math.max(1, Math.min(24, v.beatsInCycle + (Math.random() < 0.5 ? -1 : 1)));
      }
    });
    evolveLast += dt;
    // soft UI refresh occasionally
    if (Math.floor(evolveLast * 2) !== Math.floor((evolveLast - dt) * 2)) renderVoiceList();
  }

  // ---------- Voices / presets ----------
  function makeVoice(partial = {}) {
    const id = state.nextVoiceId++;
    const color = partial.color || COLORS[(id - 1) % COLORS.length];
    return {
      id,
      name: partial.name || `Voice ${id}`,
      beatsInCycle: partial.beatsInCycle ?? 3,
      usePeriod: partial.usePeriod ?? false,
      periodSec: partial.periodSec ?? 2,
      pitchMode: partial.pitchMode || "note",
      note: partial.note || "C4",
      hz: partial.hz ?? 261.63,
      waveform: partial.waveform || "sine",
      volume: partial.volume ?? 0.55,
