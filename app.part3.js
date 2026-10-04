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

  // Gate, Circular, and Cubes frames own the tone. Their draws write
  // v._gateSide = Math.sign(orbX - gx) then call this before paint so _flash
  // lands on that frame. 0 is on the line, not a hit. Same side again is not
  // a second hit. Other visual modes must not call playVoiceHit.
  // A dial tick jumps phase (tempo) or the line. That is not a meeting.
  // Hold crossings quiet until the frame after the tick has latched the new side.
  let crossingsQuiet = false;
  function quietCrossings() { crossingsQuiet = true; }
  function releaseCrossings() { crossingsQuiet = false; }

  function onGateSideSample(v, side) {
    if (state.visualMode !== "gate" && state.visualMode !== "circular" && state.visualMode !== "cubes") {
      v._gateSideSeen = null;
      return false;
    }
    if (crossingsQuiet) {
      if (side === -1 || side === 1) v._gateSideSeen = side;
      return false;
    }
    // Line dial off: remember the side so turning it back on does not false-trigger.
    if (state.visualMode === "circular" && state.circularLine === false) {
      if (side === -1 || side === 1) v._gateSideSeen = side;
      return false;
    }
    if (side !== -1 && side !== 1) return false;
    const prev = v._gateSideSeen;
    v._gateSideSeen = side;
    if (prev !== -1 && prev !== 1) return false;
    if (prev === side) return false;
    if (!state.playing || !ctx) return false;
    publishPitchHint(v);
    playVoiceHit(v, ctx.currentTime + 0.003, 1);
    return true;
  }

  // 0 = low (around C2), 1 = high (around C5). Visuals can map color and brightness.
  function publishPitchHint(v) {
    const freq = Math.max(20, resolveFreq(v));
    const t01 = Math.log(freq / 65.41) / Math.log(523.25 / 65.41);
    v._pitch01 = Math.max(0, Math.min(1, t01));
    v._pitchBand = v._pitch01 < 0.34 ? "low" : v._pitch01 < 0.67 ? "mid" : "high";
  }

  function schedule() {
    if (!state.playing || !ctx) return;
    // Turnaround steps the note with the bar. It does not call playVoiceHit.
    if (typeof advanceCircularTurnaround === "function") advanceCircularTurnaround();
    // Timer stays up so the clock keeps ticking. It must not invent notes.
    if (state.visualMode !== "gate" && state.visualMode !== "circular" && state.visualMode !== "cubes") {
      state.voices.forEach((v) => {
        v._nextGateAfter = null;
        v._gateSideSeen = null;
      });
    }
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
    const voice = {
      id,
      name: partial.name || `Voice ${id}`,
      beatsInCycle: partial.beatsInCycle ?? 3,
      usePeriod: partial.usePeriod ?? false,
      periodSec: partial.periodSec ?? 2,
      pitchMode: partial.pitchMode || "note",
      note: partial.note || "C4",
      hz: partial.hz ?? 261.63,
      pathKind: partial.pathKind || "",
      pathId: partial.pathId || "",
      waveform: partial.waveform || "sine",
      volume: partial.volume ?? 0.55,
