      state.voices.push(makeVoice({
        beatsInCycle: Math.min(24, beats),
        note: NOTES[Math.min(NOTES.length - 1, 10 + state.voices.length)],
        simplicity: state.masterSimplicity,
      }));
      renderVoiceList();
      saveLocal("autosave");
    });

    $("#saveSetup").addEventListener("click", () => {
      saveLocal("polyrhythm-studio");
      $("#saveSetup").textContent = "Saved!";
      setTimeout(() => { $("#saveSetup").textContent = "Save"; }, 1200);
    });
    $("#loadSetup").addEventListener("click", () => {
      loadLocal("polyrhythm-studio");
      syncMasterUI();
      renderVoiceList();
    });

    window.addEventListener("resize", resizeCanvas);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resizeCanvas);
    }
    // Re-bind when moving between monitors / Windows display scale changes
    try {
      matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener("change", resizeCanvas);
    } catch (_) {}
    const toggleBtn = $("#toggleControls");
    if (toggleBtn) toggleBtn.addEventListener("click", toggleControls);

    window.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable);
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (typing) return;
      if (e.key === "h" || e.key === "H" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        toggleControls();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setControlsHidden(true);
      }
    });
  }

  // ---------- Loop ----------
  let lastFrame = performance.now();
  let heatLevel = 1;
  let heatFrom = 1;
  let heatTo = 1;
  let heatDuckT0 = 0;
  let heatDuckUntil = 0;
  let heatRecovering = false;
  let heatRecoverFrom = 1;
  let heatRecoverT0 = 0;
  let heatFlagHot = false;

  function heatAudible(t) {
    if (heatRecovering) {
      const u = Math.min(1, (t - heatRecoverT0) / 1.5);
      return heatRecoverFrom + (1 - heatRecoverFrom) * u;
    }
    if (t < heatDuckUntil) {
      const u = Math.min(1, (t - heatDuckT0) / 0.04);
      return heatFrom + (heatTo - heatFrom) * u;
    }
    return heatLevel;
  }

  function masterBufferHot() {
    hotAnalyser.getFloatTimeDomainData(hotBuf);
    let peak = 0;
    let over = 0;
    for (let i = 0; i < hotBuf.length; i++) {
      const a = Math.abs(hotBuf[i]);
      if (a > peak) peak = a;
      if (a > 0.89) over++;
    }
    return peak >= 0.98 || over > 4;
  }

  function setHeatFlag(hot) {
    if (hot === heatFlagHot) return;
    heatFlagHot = hot;
    const el = document.getElementById("heatFlag");
    if (!el) return;
    el.textContent = hot ? "hot" : "clean";
    el.classList.toggle("is-hot", hot);
  }

  // easeGain sits after softLimiter and before destination. Duck it when the
  // speaker tap is hot; ease it back while frames stay clean.
  function watchMasterHeat() {
    if (!hotAnalyser || !easeGain || !ctx || !hotBuf) return;
    const t = ctx.currentTime;
    const hot = masterBufferHot();
    const cur = heatAudible(t);
    if (hot) {
      if (t >= heatDuckUntil - 0.001) {
        const to = Math.max(0.45, cur * 0.85);
        if (to < cur - 0.0005) {
          easeGain.gain.cancelScheduledValues(t);
          easeGain.gain.setValueAtTime(cur, t);
          easeGain.gain.linearRampToValueAtTime(to, t + 0.04);
          heatFrom = cur;
          heatTo = to;
          heatLevel = to;
          heatDuckT0 = t;
          heatDuckUntil = t + 0.04;
          heatRecovering = false;
        }
      }
      setHeatFlag(heatAudible(t) < 0.999);
      return;
    }
    if (cur >= 0.999) {
      heatLevel = 1;
      heatRecovering = false;
      setHeatFlag(false);
      return;
    }
    if (!heatRecovering) {
      heatRecovering = true;
      heatRecoverFrom = cur;
      heatRecoverT0 = t;
      heatLevel = 1;
      easeGain.gain.cancelScheduledValues(t);
      easeGain.gain.setValueAtTime(cur, t);
      easeGain.gain.linearRampToValueAtTime(1, t + 1.5);
    }
    setHeatFlag(heatAudible(t) < 0.999);
  }


  // ----- Cube machine (mode "cubes") -----
  // Own layout. Not a Gate look and not Circular.
  // Nested shells. The hit line is the outer vertical edge (x = z = +scale).
  // Each face traveler stair-steps from that edge to the face center and back.
  // Visual contact is local. Tone goes through onGateSideSample only.
  // Tone is onGateSideSample only (visualMode cubes is allowed). Side is
  // traveler vs the outer edge. No page-wide stroke — the hit is sparkle
  // and reflection behind the shells.
  const CUBE_FACES = ["front", "right", "top"];
  const CUBE_NOTES_HI = ["E4","D4","C4","B3","A3","G3","E3","D3","C3","B2","G2","C2"];
  const CUBE_BEATS = [5, 7, 4, 3, 8, 6, 9, 2, 11, 5, 7, 4];
  const CUBE_STEPS = 8;
  let cubeNest = 3;
  let cubeBound = false;
  let cubeInstalledNest = -1;
  let cubeFxStamp = 0;
  const cubeParts = [];
  const cubeRipples = [];

  function cubeShellScale(i, n) {
    if (n <= 1) return 1;
    return 1 - (i / (n - 1)) * 0.66;
  }

  function cubePlan(nest) {
    const plan = [];
    for (let n = 0; n < nest; n++) {
      for (let f = 0; f < CUBE_FACES.length; f++) {
        plan.push({ nest: n, face: CUBE_FACES[f], pathId: "cube-" + n + "-" + CUBE_FACES[f] });
      }
    }
    return plan;
  }

  function installCubeVoices(nest) {
    const plan = cubePlan(nest);
    const noteOf = {};
    const innerFirst = plan.slice().sort((a, b) => b.nest - a.nest);
    innerFirst.forEach((item, i) => {
      noteOf[item.pathId] = CUBE_NOTES_HI[Math.min(i, CUBE_NOTES_HI.length - 1)];
    });
    state.nextVoiceId = 1;
    state.voices = plan.map((item, i) => makeVoice({
      name: "N" + (item.nest + 1) + " " + item.face,
      pathId: item.pathId,
      pathKind: "square",
      beatsInCycle: CUBE_BEATS[i % CUBE_BEATS.length],
      note: noteOf[item.pathId],
      waveform: "sine",
      volume: 0.11,
      simplicity: 78,
      phase: (item.nest * 0.23 + i * 0.09) % 1,
      pan: item.face === "right" ? 0.28 : item.face === "front" ? -0.22 : 0.04,
      color: COLORS[(item.nest * 3 + CUBE_FACES.indexOf(item.face)) % COLORS.length],
    }));
    state.voices.forEach(publishPitchHint);
    if (typeof resetVoiceSchedulers === "function") resetVoiceSchedulers();
    if (typeof renderVoiceList === "function") renderVoiceList();
    cubeInstalledNest = nest;
  }

  function ensureCubeMachine() {
    if (state.visualMode !== "cubes") return;
    bindCubeControls();
    const nest = Math.max(1, Math.min(4, cubeNest | 0));
    cubeNest = nest;
    const plan = cubePlan(nest);
    let ok = state.voices.length === plan.length && cubeInstalledNest === nest;
    if (ok) {
      for (let i = 0; i < plan.length; i++) {
        if (!state.voices.some((v) => v.pathId === plan[i].pathId)) { ok = false; break; }
      }
    }
    if (!ok) installCubeVoices(nest);
  }

  function bindCubeControls() {
    if (cubeBound) return;
    cubeBound = true;
    const up = document.getElementById("cubeNestUp");
    const dn = document.getElementById("cubeNestDown");
    if (up) up.addEventListener("click", () => {
      cubeNest = Math.min(4, cubeNest + 1);
      cubeInstalledNest = -1;
    });
    if (dn) dn.addEventListener("click", () => {
      cubeNest = Math.max(1, cubeNest - 1);
      cubeInstalledNest = -1;
    });
  }

  function syncCubeChrome() {
    const cubes = state.visualMode === "cubes";
    document.body.classList.toggle("mode-cubes", cubes);
    const row = document.getElementById("cubeDials");
    if (row) row.hidden = !cubes;
    // Hide other stage panels while Cube is up. Do not unhide on the way out —
    // syncMasterUI owns Circular vs Gate exclusivity.
    if (cubes) {
      const gate = document.getElementById("dialRow");
      const circ = document.getElementById("circularDials");
      const looks = document.getElementById("gateLooks");
      if (gate) gate.hidden = true;
      if (circ) circ.hidden = true;
      if (looks) looks.hidden = true;
    }
    const read = document.getElementById("cubeNestRead");
    if (read && cubes) {
      read.textContent = cubeNest + (cubeNest === 1 ? " nest" : " nests");
    }
  }

  function cubeYaw(t) {
    return 0.62 + Math.sin(t * 0.22) * 0.16;
  }

  function cubeProject(x, y, z, cx, cy, unit, yaw) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const rx = x * c + z * s;
    const rz = -x * s + z * c;
    const ix = (rx - rz) * 0.88;
    const iy = (rx + rz) * 0.46 - y * 1.05;
    return [cx + ix * unit, cy + iy * unit];
  }

  function cubeLerp(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  function cubeFaceEnds(scale, face) {
    const s = scale;
    if (face === "front") return { edge: [s, 0, s], center: [0, 0, s] };
    if (face === "right") return { edge: [s, 0, s], center: [s, 0, 0] };
    return { edge: [s, s, s], center: [0, s, 0] };
  }

  function cubeStair(v, t) {
    const period = Math.max(0.12, voicePeriodSec(v));
    const p = ((t / period + (v.phase || 0)) % 1 + 1) % 1;
    const tri = p < 0.5 ? p * 2 : 2 - p * 2;
    const step = Math.round(tri * CUBE_STEPS);
    const along = step === 0 ? -0.075 : step / CUBE_STEPS;
    return { step, along, period };
  }

  const CUBE_EDGES = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const cubeGlints = [];

  function cubeShellGeom(cx, cy, unit, yaw, scale) {
    const s = scale;
    const corners = [];
    for (let xi = -1; xi <= 1; xi += 2) {
      for (let yi = -1; yi <= 1; yi += 2) {
        for (let zi = -1; zi <= 1; zi += 2) {
          corners.push(cubeProject(xi * s, yi * s, zi * s, cx, cy, unit, yaw));
        }
      }
    }
    const hitA = cubeProject(s, -s, s, cx, cy, unit, yaw);
    const hitB = cubeProject(s, s, s, cx, cy, unit, yaw);
    return { corners, hitA, hitB, scale: s };
  }

  function cubeHorizon(cy, unit) {
    return cy + unit * 0.86;
  }

  // Hard cut-stone mirror. No wave — that read as Circular's liquid sheet.
  function cubeMirror(x, y, horizon) {
    return [x + (y - horizon) * 0.035, horizon + (horizon - y)];
  }

  function ensureCubeGlints() {
    if (cubeGlints.length) return;
    for (let i = 0; i < 72; i++) {
      cubeGlints.push({
        u: ((i * 37) % 100) / 100,
        v: ((i * 53) % 100) / 100,
        phase: (i * 0.91) % (Math.PI * 2),
        rise: 0.12 + (i % 6) * 0.035,
        hot: i % 4 === 0,
      });
    }
  }

  function paintEmber(g, x, y, s, color, a) {
    if (a <= 0.02 || !isFinite(x) || !isFinite(y)) return;
    g.save();
    g.translate(x, y);
    g.rotate(Math.PI / 4);
    g.fillStyle = hexAlpha(color, a);
    g.fillRect(-s, -s, s * 2, s * 2);
    g.fillStyle = hexAlpha("#ffe7c8", Math.min(1, a * 0.85));
    g.fillRect(-s * 0.28, -s * 0.28, s * 0.56, s * 0.56);
    g.restore();
  }

  function strokeKilnSquare(g, x, y, s, color, a) {
    if (a <= 0.02) return;
    g.strokeStyle = hexAlpha(color, a);
    g.lineWidth = 1.15;
    g.strokeRect(x - s, y - s * 0.72, s * 2, s * 1.44);
  }

  function spawnCubeHit(x, y, color, nx, ny) {
    cubeRipples.push({ x, y, color, age: 0, life: 0.7 });
    const len = Math.hypot(nx, ny) || 1;
    const ux = nx / len;
    const uy = ny / len;
    for (let i = 0; i < 16; i++) {
      const spread = (i / 15 - 0.5) * 1.15;
      const px = ux * 0.75 - uy * spread;
      const py = uy * 0.75 + ux * spread;
      const sp = 55 + (i % 4) * 28;
      cubeParts.push({
        x, y,
        vx: px * sp,
        vy: py * sp - 18,
        life: 0.55 + (i % 5) * 0.06,
        age: 0,
        s: 1.7 + (i % 3) * 0.9,
        color,
      });
    }
  }

  function tickCubeFx(dt) {
    for (let i = cubeParts.length - 1; i >= 0; i--) {
      const p = cubeParts[i];
      p.age += dt;
      if (p.age >= p.life) { cubeParts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    for (let i = cubeRipples.length - 1; i >= 0; i--) {
      cubeRipples[i].age += dt;
      if (cubeRipples[i].age >= cubeRipples[i].life) cubeRipples.splice(i, 1);
    }
  }

  function drawCubeBackdrop(g, w, h, cx, cy, unit, t, shells) {
    const horizon = cubeHorizon(cy, unit);
    const kiln = g.createLinearGradient(cx, cy - unit * 1.6, cx, horizon + unit * 1.4);
    kiln.addColorStop(0, "rgba(18,6,10,0)");
    kiln.addColorStop(0.45, "rgba(70,22,8,0.10)");
    kiln.addColorStop(0.72, "rgba(140,48,12,0.16)");
    kiln.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = kiln;
    g.fillRect(0, 0, w, h);

    // Polished obsidian slab — straight reflection, copper ghost, not a pond.
    g.save();
    g.beginPath();
    g.rect(0, horizon - 1, w, Math.max(0, h - horizon + 2));
    g.clip();
    const slab = g.createLinearGradient(0, horizon, 0, horizon + unit * 1.5);
    slab.addColorStop(0, "rgba(90,36,12,0.22)");
    slab.addColorStop(1, "rgba(20,6,4,0)");
    g.fillStyle = slab;
    g.fillRect(0, horizon, w, h);
    for (let pass = 0; pass < 2; pass++) {
      const shift = pass === 0 ? 0 : -unit * 0.06;
      const col = pass === 0 ? "rgba(255,168,84," : "rgba(180,60,40,";
      for (let s = 0; s < shells.length; s++) {
        const geo = shells[s];
        g.strokeStyle = col + (0.34 - s * 0.05 - pass * 0.12).toFixed(3) + ")";
        g.lineWidth = pass === 0 ? 1.15 : 0.8;
        g.beginPath();
        for (let i = 0; i < CUBE_EDGES.length; i++) {
          const a = geo.corners[CUBE_EDGES[i][0]];
          const b = geo.corners[CUBE_EDGES[i][1]];
          const ma = cubeMirror(a[0] + shift, a[1], horizon);
          const mb = cubeMirror(b[0] + shift, b[1], horizon);
          g.moveTo(ma[0], ma[1]);
          g.lineTo(mb[0], mb[1]);
        }
        g.stroke();
      }
    }
    for (let i = 0; i < state.voices.length; i++) {
      const v = state.voices[i];
      const d = v._cubeDraw;
      if (!d) continue;
      const m = cubeMirror(d.scr[0], d.scr[1], horizon);
      paintEmber(g, m[0], m[1], 2.1 + d.scale * 1.6, v.color, 0.5);
    }
    g.restore();

    ensureCubeGlints();
    for (let i = 0; i < cubeGlints.length; i++) {
      const gl = cubeGlints[i];
      const x = cx + (gl.u - 0.5) * unit * 3.4;
      const rise = ((gl.v + t * gl.rise) % 1);
      const y = horizon - rise * unit * 2.7;
      const tw = 0.2 + 0.8 * Math.pow(0.5 + 0.5 * Math.sin(t * 3.1 + gl.phase), 2);
      const col = gl.hot ? "#ffb15a" : "#ffd8a8";
      paintEmber(g, x, y, gl.hot ? 2.1 : 1.25, col, tw * 0.7);
      if (y < horizon - 6) {
        const m = cubeMirror(x, y, horizon);
        paintEmber(g, m[0], m[1], 1.1, col, tw * 0.28);
      }
    }

    for (let i = 0; i < cubeRipples.length; i++) {
      const r = cubeRipples[i];
      const k = r.age / r.life;
      const s = 8 + k * 78;
      strokeKilnSquare(g, r.x, r.y, s, r.color, (1 - k) * 0.9);
      strokeKilnSquare(g, r.x, r.y, s * 0.55, "#ffd2a4", (1 - k) * 0.45);
      const m = cubeMirror(r.x, r.y, horizon);
      strokeKilnSquare(g, m[0], m[1], s * 0.92, r.color, (1 - k) * 0.4);
    }
    for (let i = 0; i < cubeParts.length; i++) {
      const p = cubeParts[i];
      const k = p.age / p.life;
      paintEmber(g, p.x, p.y, p.s * (1 - k * 0.3), p.color, (1 - k) * 0.95);
      const m = cubeMirror(p.x, p.y, horizon);
      paintEmber(g, m[0], m[1], p.s * 0.7, p.color, (1 - k) * 0.38);
    }
  }

  function drawCubeWire(g, geo, hot) {
    const faces = [
      { ids: [1,5,7,3], fill: "rgba(36,12,18,0.78)" },
      { ids: [4,5,7,6], fill: "rgba(48,24,10,0.74)" },
      { ids: [2,3,7,6], fill: "rgba(22,14,12,0.70)" },
    ];
    for (let f = 0; f < faces.length; f++) {
      const ids = faces[f].ids;
      g.fillStyle = faces[f].fill;
      g.beginPath();
      g.moveTo(geo.corners[ids[0]][0], geo.corners[ids[0]][1]);
      for (let i = 1; i < ids.length; i++) g.lineTo(geo.corners[ids[i]][0], geo.corners[ids[i]][1]);
      g.closePath();
      g.fill();
    }
    g.lineWidth = hot ? 1.45 : 1.05;
    g.strokeStyle = hot ? "rgba(255,214,170,0.88)" : "rgba(214,132,68,0.55)";
    g.beginPath();
    for (let i = 0; i < CUBE_EDGES.length; i++) {
      const a = geo.corners[CUBE_EDGES[i][0]];
      const b = geo.corners[CUBE_EDGES[i][1]];
      g.moveTo(a[0], a[1]);
      g.lineTo(b[0], b[1]);
    }
    g.stroke();
  }

  function drawCubes(g, w, h, t, sampleOnly) {
    ensureCubeMachine();
    const nowMs = performance.now();
    const dt = cubeFxStamp ? Math.min(0.05, (nowMs - cubeFxStamp) / 1000) : 0.016;
    cubeFxStamp = nowMs;
    tickCubeFx(dt);

    const nest = cubeNest;
    const yaw = cubeYaw(t);
    const cx = w * 0.5;
    const cy = h * 0.44;
    const unit = Math.min(w, h) * 0.20;
    const origin = cubeProject(0, 0, 0, cx, cy, unit, yaw);

    for (let i = 0; i < state.voices.length; i++) {
      const v = state.voices[i];
      const id = String(v.pathId || "");
      if (id.indexOf("cube-") !== 0) continue;
      const bits = id.split("-");
      const shell = Number(bits[1]);
      const face = bits[2];
      if (!CUBE_FACES.includes(face) || !(shell >= 0)) continue;
      const scale = cubeShellScale(shell, nest);
      const ends = cubeFaceEnds(scale, face);
      const stair = cubeStair(v, t);
      const pos = cubeLerp(ends.edge, ends.center, stair.along);
      const scr = cubeProject(pos[0], pos[1], pos[2], cx, cy, unit, yaw);
      const edgeScr = cubeProject(ends.edge[0], ends.edge[1], ends.edge[2], cx, cy, unit, yaw);
      const lineX = edgeScr[0];
      v._orbPhase = stair.along;
      v._orbX = scr[0];
      v._orbY = scr[1];
      const side = Math.sign(scr[0] - lineX);
      v._gateSide = side;
      if (typeof publishPitchHint === "function") publishPitchHint(v);
      if (typeof onGateSideSample === "function") onGateSideSample(v, side);
      const prev = v._cubeStep;
      v._cubeStep = stair.step;
      if (typeof prev === "number" && prev > 0 && stair.step === 0) {
        v._flash = 1;
        v._flashX = edgeScr[0];
        v._flashY = edgeScr[1];
        const nx = edgeScr[0] - origin[0];
        const ny = edgeScr[1] - origin[1];
        spawnCubeHit(edgeScr[0], edgeScr[1], v.color, nx, ny);
      }
      v._cubeDraw = { shell, face, scale, stair, scr, edge: ends.edge, center: ends.center };
    }

    if (sampleOnly) return;

    const hotShell = new Array(nest).fill(false);
    for (let i = 0; i < state.voices.length; i++) {
      const d = state.voices[i]._cubeDraw;
      if (d && d.stair.step === 0) hotShell[d.shell] = true;
    }

    const shells = [];
    for (let s = 0; s < nest; s++) {
      shells.push(cubeShellGeom(cx, cy, unit, yaw, cubeShellScale(s, nest)));
    }
    // Kiln embers and a hard obsidian reflection sit behind the shells. No page-wide stroke.
    drawCubeBackdrop(g, w, h, cx, cy, unit, t, shells);
    for (let s = 0; s < nest; s++) drawCubeWire(g, shells[s], !!hotShell[s]);

    g.save();
    for (let i = 0; i < state.voices.length; i++) {
      const v = state.voices[i];
      const d = v._cubeDraw;
      if (!d) continue;
      const ends = { edge: d.edge, center: d.center };
      const step = d.stair.step;
      const a = cubeProject(ends.edge[0], ends.edge[1], ends.edge[2], cx, cy, unit, yaw);
      const b = cubeProject(ends.center[0], ends.center[1], ends.center[2], cx, cy, unit, yaw);
      g.strokeStyle = hexAlpha(v.color, 0.28);
      g.lineWidth = 1.25;
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.lineTo(b[0], b[1]);
      g.stroke();
      const flash = Math.min(v._flash || 0, 1);
      for (let k = 0; k <= CUBE_STEPS; k++) {
        const along = k / CUBE_STEPS;
        const p3 = cubeLerp(ends.edge, ends.center, along);
        const p = cubeProject(p3[0], p3[1], p3[2], cx, cy, unit, yaw);
        const dist = Math.abs(k - step);
        const amp = Math.exp(-(dist * dist) / 5.2);
        const rise = amp * amp * unit * (0.055 + d.scale * 0.04);
        const size = unit * (0.028 + amp * 0.055 + flash * 0.02) * (0.72 + d.scale * 0.28);
        const x = p[0];
        const y = p[1] - rise;
        g.fillStyle = hexAlpha(v.color, 0.22 + amp * 0.7);
        g.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        if (k === step) {
          g.strokeStyle = "rgba(255,226,196,0.92)";
          g.lineWidth = 1.25;
          g.strokeRect(x - size * 0.65, y - size * 0.65, size * 1.3, size * 1.3);
        }
      }
    }
    g.restore();

  }

  let frameSerial = 0;
  function frame(now) {
    const gap = now - lastFrame;
    const dt = Math.min(0.05, gap / 1000);
    lastFrame = now;
    watchMasterHeat();
    if (state.playing) evolveStep(dt);
    frameSerial++;
    const skipPaint = renderStride > 1 && (frameSerial % renderStride) !== 0;
    const t0 = performance.now();
    if (skipPaint) {
      // Paint drops a frame; gate sampling still runs so tone-on-cross holds.
      if (state.visualMode === "gate" || state.visualMode === "circular") {
        const c = canvas();
        const transport = state.playing ? transportTime() : pauseAccum;
        const ctx2 = c.getContext("2d");
        if (state.visualMode === "gate") drawGate(ctx2, c.clientWidth, c.clientHeight, transport, true);
        else drawCircular(ctx2, c.clientWidth, c.clientHeight, transport, true);
      }
      else if (state.visualMode === "cubes") {
        const c = canvas();
        const transport = state.playing ? transportTime() : pauseAccum;
        const ctx2 = c.getContext("2d");
        drawCubes(ctx2, c.clientWidth, c.clientHeight, transport, true);
      }
      state.voices.forEach((v) => {
        v._flash = Math.max(0, (v._flash || 0) - 0.028);
        if (v._flash === 0) { v._flashX = null; v._flashY = null; }
      });
    } else {
      draw(now);
    }
    paintDialGlow(now);
    noteFrameCost(performance.now() - t0, gap);
    releaseCrossings();
    requestAnimationFrame(frame);
  }

  // ---------- Boot ----------
  function boot() {
    let loadedOk = false;
    try {
      const raw = localStorage.getItem("polyrhythm-studio") || localStorage.getItem("autosave");
      if (raw) {
        const data = JSON.parse(raw);
        if ((data.configVersion || 0) >= 2) {
          loadSerialized(data);
          loadedOk = true;
        }
        // else: stale pre-v2 autosave — ignore and apply Session Ready below
      }
    } catch (_) {}
    if (!loadedOk || !state.voices.length) {
      applyPreset("Session Ready"); // also saveLocal("autosave") with configVersion: 2
    }
    bindUI();
    setControlsHidden(state.controlsHidden !== false); // default immersive: drawer hidden
    syncMasterUI();
    renderVoiceList();
    resizeCanvas();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
