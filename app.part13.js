      const amp = rowH * (0.28 + (1 - s) * 0.18);
      const phase = (t / period) * Math.PI * 2 + (v.phase || 0) * Math.PI * 2;
      g.strokeStyle = hexAlpha(v.color, 0.75);
      g.lineWidth = 1.6 + (v._flash || 0) * 2;
      g.beginPath();
      const steps = Math.max(80, Math.floor(span / 4));
      for (let x = 0; x <= steps; x++) {
        const u = x / steps;
        // hammer-ish: softer peaks via sin^3 blend
        const wave = Math.sin(u * Math.PI * 4 + phase);
        const hammer = Math.sign(wave) * Math.pow(Math.abs(wave), 0.65);
        const y = y0 + hammer * amp;
        const px = left + u * span;
        if (x === 0) g.moveTo(px, y);
        else g.lineTo(px, y);
      }
      g.stroke();
      g.fillStyle = hexAlpha(v.color, 0.7);
      g.font = "11px ui-monospace, monospace";
      g.fillText(v.name.slice(0, 8), 6, y0 + 4);
      // pulse marker on visual crest (canvas y↓; sin=-1 → y0-amp)
      const uHit = ((0.375 - phase / (Math.PI * 4)) % 1 + 1) % 1;
      const waveHit = Math.sin(uHit * Math.PI * 4 + phase);
      const hammerHit = Math.sign(waveHit) * Math.pow(Math.abs(waveHit), 0.65);
      const hx = left + uHit * span;
      const hy = y0 + hammerHit * amp;
      g.fillStyle = hexAlpha(v.color, 0.9);
      g.beginPath();
      g.arc(hx, hy, 4 + (v._flash || 0) * 6, 0, Math.PI * 2);
      g.fill();
    });
  }

  function drawSineRibbons(g, w, h, t) {
    // Sine Rhythms — stacked full-width sine curves
    const n = state.voices.length || 1;
    const top = 20;
    const bottom = h - 20;
    const band = (bottom - top) / n;
    state.voices.forEach((v, i) => {
      const y0 = top + band * (i + 0.5);
      const s = effectiveSimplicity(v);
      const period = voicePeriodSec(v);
      const amp = band * (0.32 + (1 - s) * 0.2);
      const phase = (t / period) * Math.PI * 2 + (v.phase || 0) * Math.PI * 2;
      const cycles = 2 + (i % 3);
      g.strokeStyle = hexAlpha(v.color, 0.15);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, y0);
      g.lineTo(w, y0);
      g.stroke();
      g.strokeStyle = hexAlpha(v.color, 0.8);
      g.lineWidth = 2 + (v._flash || 0) * 2.5;
      g.beginPath();
      const steps = Math.max(100, Math.floor(w / 3));
      for (let x = 0; x <= steps; x++) {
        const u = x / steps;
        const y = y0 + Math.sin(u * Math.PI * 2 * cycles + phase) * amp;
        const px = u * w;
        if (x === 0) g.moveTo(px, y);
        else g.lineTo(px, y);
      }
      g.stroke();
      // glow fill under ribbon
      g.lineTo(w, y0 + amp + 8);
      g.lineTo(0, y0 + amp + 8);
      g.closePath();
      g.fillStyle = hexAlpha(v.color, 0.04 + (v._flash || 0) * 0.08);
      g.fill();
    });
  }

  // ----- Lucid Rhythms (vertical glass cubes) -----
  // HD isometric glass cubes bounce with gravity/velocity; floor is the meeting edge.
  // side +1 = floor collision/meeting; side -1 = above. Same latch as Gate/Circular.
  // Columns sorted low pitch left → high right. Edge glow hue unique per tone.
  const lucidPulses = [];
  let lucidFxStamp = 0;
  let lucidStructFlash = 0;

  function lucidMachineLive() {
    return state.visualMode === "lucid" && state.voices.some((v) => /^lucid-\d+$/.test(String(v.pathId || "")));
  }

  function ensureLucidMachine() {
    if (state.visualMode !== "lucid") return;
    if (lucidMachineLive()) return;
    if (typeof installLucidVoices === "function") {
      installLucidVoices();
      if (!state.activePreset) state.activePreset = "Lucid Rhythms";
      return;
    }
    if (typeof applyPreset === "function") applyPreset("Lucid Rhythms");
  }

  function tickLucidFx(dt) {
    lucidStructFlash = Math.max(0, lucidStructFlash - dt * 2.1);
    for (let i = lucidPulses.length - 1; i >= 0; i--) {
      lucidPulses[i].life -= dt;
      if (lucidPulses[i].life <= 0) lucidPulses.splice(i, 1);
    }
  }

  function spawnLucidPulse(v, x, y, edgeRgb) {
    lucidStructFlash = 1;
    lucidPulses.push({
      life: 0.62,
      max: 0.62,
      color: v.color,
      edge: edgeRgb || null,
      x: x,
      y: y,
    });
    if (lucidPulses.length > 14) lucidPulses.shift();
  }

  // Absolute pitch (Hz) for column sort — prefer resolveFreq / note / _pitch01 / lucid-N.
  function lucidVoicePitch(v) {
    if (!v) return 220;
    if (typeof resolveFreq === "function") {
      try {
        const f = resolveFreq(v);
        if (f && isFinite(f) && f > 0) return f;
      } catch (e) { /* fall through */ }
    }
    if (v.note && typeof NOTE_FREQ !== "undefined" && NOTE_FREQ[v.note]) return NOTE_FREQ[v.note];
    if (typeof v.hz === "number" && isFinite(v.hz) && v.hz > 0) return v.hz;
    if (typeof publishPitchHint === "function") publishPitchHint(v);
    if (typeof v._pitch01 === "number" && isFinite(v._pitch01)) {
      return 65.41 * Math.pow(523.25 / 65.41, Math.max(0, Math.min(1, v._pitch01)));
    }
    const m = String(v.pathId || "").match(/^lucid-(\d+)$/);
    if (m) return 65.41 * Math.pow(2, Number(m[1]) * 0.35);
    return 220;
  }

  function lucidPitch01(v) {
    if (typeof publishPitchHint === "function") publishPitchHint(v);
    if (typeof v._pitch01 === "number" && isFinite(v._pitch01)) {
      return Math.max(0, Math.min(1, v._pitch01));
    }
    const f = lucidVoicePitch(v);
    return Math.max(0, Math.min(1, Math.log(Math.max(20, f) / 65.41) / Math.log(523.25 / 65.41)));
  }

  // Distinct rim hue per tone: deep indigo (low) → aqua → soft gold (high).
  // Lucid glass identity — not Gate neon cube, not kiln ember.
  function lucidToneRgb(v) {
    const p = lucidPitch01(v);
    const h = (268 - p * 198) / 360; // 268° → 70°
    const s = 0.58 + p * 0.28;
    const l = 0.46 + p * 0.16;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p2 = 2 * l - q;
    const hue2rgb = (t, uu, vv) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return uu + (vv - uu) * 6 * t;
      if (t < 1 / 2) return vv;
      if (t < 2 / 3) return uu + (vv - uu) * (2 / 3 - t) * 6;
      return uu;
    };
    return [
      Math.round(hue2rgb(h + 1 / 3, p2, q) * 255),
      Math.round(hue2rgb(h, p2, q) * 255),
      Math.round(hue2rgb(h - 1 / 3, p2, q) * 255),
    ];
  }

  function lucidRgba(rgb, a) {
    return "rgba(" + (rgb[0] | 0) + "," + (rgb[1] | 0) + "," + (rgb[2] | 0) + "," + a + ")";
  }

  function lucidMixRgb(a, b, t) {
    const u = Math.max(0, Math.min(1, t));
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  }

  // High-definition isometric glass cube — translucent faces, specular, tone rim glow.
  // Resting contact = visible MASS bottom (botL/botR), NOT the sharp iso tip (botF).
  // Physics _lucidY and draw bottomY both mean this plane — flush on shaft sill when landed.
  // Flash must NOT change contact (no size*(1+f) in the rest offset) or cubes lift on hit.
  function lucidCubeContact(size) {
    const s = Math.max(1, size || 1);
    const dy = s * 0.45;
    const dz = s * 0.95;
    return dz * 0.45 + dy * 0.35; // botL / botR resting plane
  }

  // HD isometric glass cube. bottomY = visible mass resting plane (shaft sill when landed).
  function drawLucidGlassCube(g, cx, bottomY, size, edgeRgb, flash, muted) {
    const f = Math.max(0, Math.min(1, flash || 0));
    // Geometry size is stable; flash only brightens / soft-blooms (no lift on hit).
    const s = Math.max(1, size || 1);
    const dx = s * 0.78;
    const dy = s * 0.45;
    const dz = s * 0.95;
    const contact = dz * 0.45 + dy * 0.35; // must match lucidCubeContact(s)
    const cy = bottomY - contact;
    // Tip (botF) sits slightly below the sill into the floor lip — planted, not floating.
    const topPeak = [cx, cy - dz * 0.55 - dy * 0.15];
    const topR = [cx + dx, cy - dz * 0.55 + dy * 0.35];
    const topF = [cx, cy - dz * 0.55 + dy * 0.85];
    const topL = [cx - dx, cy - dz * 0.55 + dy * 0.35];
    const botR = [cx + dx, cy + dz * 0.45 + dy * 0.35]; // y === bottomY
    const botF = [cx, cy + dz * 0.45 + dy * 0.85];
    const botL = [cx - dx, cy + dz * 0.45 + dy * 0.35]; // y === bottomY

    // Clip everything (bloom + body) to the sill so nothing paints under the floor.
    g.save();
    g.beginPath();
    g.rect(cx - s * 2.4, cy - s * 3.4, s * 4.8, bottomY - (cy - s * 3.4) + 0.75);
    g.clip();

    const white = [245, 252, 255];
    const cool = [140, 185, 230];
    const deep = [40, 70, 110];
    const edge = edgeRgb || cool;
    const aMul = muted ? 0.28 : 1;

    const fillPoly = (pts, style) => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      g.fillStyle = style;
      g.fill();
    };
    const strokePoly = (pts, style, width) => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      g.strokeStyle = style;
      g.lineWidth = width;
      g.stroke();
    };

    g.save();
    g.globalCompositeOperation = "lighter";
    const bloomR = s * (1.85 + f * 1.1);
    const bloom = g.createRadialGradient(cx, cy, s * 0.15, cx, cy, bloomR);
    bloom.addColorStop(0, lucidRgba(edge, (0.28 + f * 0.42) * aMul));
    bloom.addColorStop(0.45, lucidRgba(edge, (0.1 + f * 0.18) * aMul));
    bloom.addColorStop(1, lucidRgba(edge, 0));
    g.fillStyle = bloom;
    g.beginPath();
    g.arc(cx, cy, bloomR, 0, Math.PI * 2);
    g.fill();
    g.restore();

    g.save();
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = aMul;

    const rightGrad = g.createLinearGradient(topF[0], topF[1], botR[0], botR[1]);
    rightGrad.addColorStop(0, lucidRgba(lucidMixRgb(cool, white, 0.35), 0.22 + f * 0.12));
    rightGrad.addColorStop(0.45, lucidRgba(lucidMixRgb(edge, cool, 0.35), 0.16 + f * 0.08));
    rightGrad.addColorStop(1, lucidRgba(lucidMixRgb(deep, edge, 0.4), 0.28 + f * 0.1));
    fillPoly([topF, topR, botR, botF], rightGrad);

    const leftGrad = g.createLinearGradient(topL[0], topL[1], botF[0], botF[1]);
    leftGrad.addColorStop(0, lucidRgba(lucidMixRgb(cool, edge, 0.25), 0.2 + f * 0.1));
    leftGrad.addColorStop(0.5, lucidRgba(lucidMixRgb(deep, cool, 0.45), 0.18 + f * 0.08));
    leftGrad.addColorStop(1, lucidRgba(deep, 0.32 + f * 0.1));
    fillPoly([topL, topF, botF, botL], leftGrad);

    const topGrad = g.createLinearGradient(topL[0], topPeak[1], topF[0], topF[1]);
    topGrad.addColorStop(0, lucidRgba(white, 0.55 + f * 0.25));
    topGrad.addColorStop(0.35, lucidRgba(lucidMixRgb(white, edge, 0.2), 0.32 + f * 0.15));
    topGrad.addColorStop(0.7, lucidRgba(lucidMixRgb(cool, edge, 0.35), 0.2 + f * 0.1));
    topGrad.addColorStop(1, lucidRgba(lucidMixRgb(edge, cool, 0.4), 0.26 + f * 0.12));
    fillPoly([topPeak, topR, topF, topL], topGrad);

    g.save();
    g.beginPath();
    g.moveTo(topPeak[0], topPeak[1]);
    g.lineTo(topR[0], topR[1]);
    g.lineTo(topF[0], topF[1]);
    g.lineTo(topL[0], topL[1]);
    g.closePath();
    g.clip();
    const spec = g.createLinearGradient(topL[0], topPeak[1], topR[0], topF[1]);
    spec.addColorStop(0, "rgba(255,255,255,0)");
    spec.addColorStop(0.42, "rgba(255,255,255," + (0.08 + f * 0.12) + ")");
    spec.addColorStop(0.52, "rgba(255,255,255," + (0.55 + f * 0.3) + ")");
    spec.addColorStop(0.62, "rgba(255,255,255," + (0.1 + f * 0.1) + ")");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = spec;
    g.fillRect(cx - s * 1.4, cy - s * 1.4, s * 2.8, s * 2.8);
    for (let i = 0; i < 3; i++) {
      const fx = cx + (i - 1) * s * 0.28;
      const fy = cy - dz * 0.35 + (i % 2) * s * 0.12;
      const fr = s * (0.18 + i * 0.05);
      const frost = g.createRadialGradient(fx, fy, 0, fx, fy, fr);
      frost.addColorStop(0, "rgba(255,255,255," + (0.12 + f * 0.08) + ")");
      frost.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = frost;
      g.beginPath();
      g.arc(fx, fy, fr, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    strokePoly([topF, topR, botR, botF], "rgba(20,40,70,0.22)", 1);
    strokePoly([topL, topF, botF, botL], "rgba(20,40,70,0.26)", 1);
    strokePoly([topPeak, topR, topF, topL], "rgba(255,255,255,0.35)", 1.05);

    g.globalCompositeOperation = "lighter";
    const rimA = (0.42 + f * 0.5) * aMul;
    const rimW = 1.35 + f * 2.1;
    strokePoly([topPeak, topR, botR, botF, botL, topL], lucidRgba(edge, rimA), rimW);
    strokePoly([topPeak, topR, topF, topL], lucidRgba(white, 0.25 + f * 0.35), 1.1 + f);
    g.beginPath();
    g.moveTo(topL[0], topL[1]);
    g.lineTo(topF[0], topF[1]);
    g.lineTo(topR[0], topR[1]);
    g.moveTo(topF[0], topF[1]);
    g.lineTo(botF[0], botF[1]);
    g.strokeStyle = lucidRgba(edge, 0.55 + f * 0.4);
    g.lineWidth = 1.2 + f * 1.4;
    g.stroke();

    g.restore();
    g.restore(); // sill clip
  }

  // Crystal shaft column — glass walls + floor lip. Floor Y is the collision plane.
  function drawLucidCrystalShaft(g, x, topY, floorY, halfW, toneRgb, struct) {
    const L = x - halfW;
    const R = x + halfW;
    const rgb = toneRgb || [150, 180, 230];
    const glow = Math.min(1, struct || 0);

    // Shaft body — translucent crystal, no grey slab under the floor.
    const body = g.createLinearGradient(L, topY, R, floorY);
    body.addColorStop(0, lucidRgba(rgb, 0.03 + glow * 0.05));
    body.addColorStop(0.55, lucidRgba(rgb, 0.045 + glow * 0.08));
    body.addColorStop(1, lucidRgba(rgb, 0.08 + glow * 0.14));
    g.fillStyle = body;
    g.fillRect(L, topY, halfW * 2, floorY - topY);

    // Inner refraction wash (vertical).
    const sheen = g.createLinearGradient(L, topY, L + halfW * 0.45, floorY);
    sheen.addColorStop(0, "rgba(255,255,255," + (0.04 + glow * 0.06) + ")");
    sheen.addColorStop(0.5, "rgba(255,255,255,0)");
    sheen.addColorStop(1, lucidRgba(rgb, 0.05 + glow * 0.1));
    g.fillStyle = sheen;
    g.fillRect(L, topY, halfW * 2, floorY - topY);

    // Crystal side walls.
    g.strokeStyle = lucidRgba(rgb, 0.16 + glow * 0.35);
    g.lineWidth = 1.15 + glow * 0.9;
    g.beginPath();
    g.moveTo(L, topY);
    g.lineTo(L, floorY);
    g.moveTo(R, topY);
    g.lineTo(R, floorY);
    g.stroke();

    // Soft top lip of the shaft (not a page-wide gate).
    g.strokeStyle = "rgba(220,235,255," + (0.12 + glow * 0.2) + ")";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(L, topY);
    g.lineTo(R, topY);
    g.stroke();

    // Shaft floor = structure bottom for this column (bright crystal sill).
    // Drawn ON floorY only — no translucent plate under/past the sill.
    g.strokeStyle = "rgba(255,255,255," + (0.4 + glow * 0.5) + ")";
    g.lineWidth = 1.35 + glow * 1.8;
    g.beginPath();
    g.moveTo(L, floorY);
    g.lineTo(R, floorY);
    g.stroke();
    const sill = g.createLinearGradient(L, floorY - 2.5, R, floorY);
    sill.addColorStop(0, lucidRgba(rgb, 0.12 + glow * 0.2));
    sill.addColorStop(0.5, "rgba(245,252,255," + (0.5 + glow * 0.35) + ")");
    sill.addColorStop(1, lucidRgba(rgb, 0.12 + glow * 0.2));
    g.fillStyle = sill;
    g.fillRect(L, floorY - 2.5, halfW * 2, 2.5); // entirely above/on floorY
  }

  function drawLucid(g, w, h, t, sampleOnly) {
    ensureLucidMachine();
    const nowMs = performance.now();
    const dt = lucidFxStamp ? Math.min(0.05, (nowMs - lucidFxStamp) / 1000) : 0.016;
    lucidFxStamp = nowMs;
    tickLucidFx(dt);

    // Only one cube per lucid-0…lucid-9. Skip mute bass / any bass traveler (ghost col).
    const bars = [];
    const seen = Object.create(null);
    for (let i = 0; i < state.voices.length; i++) {
      const v = state.voices[i];
      const id = String(v.pathId || "");
      if (!/^lucid-\d+$/.test(id)) continue;
      if (seen[id]) continue;
      seen[id] = true;
      bars.push(v);
    }
    if (!bars.length) {
      for (let i = 0; i < state.voices.length; i++) {
        const v = state.voices[i];
        const id = String(v.pathId || "");
        if (v.role === "bass" || id === "lucid-bass" || id.indexOf("lucid-bass") === 0) continue;
        if (seen[id || ("i" + i)]) continue;
        seen[id || ("i" + i)] = true;
        bars.push(v);
      }
    }
    // Low octaves left → high right (Audio lucid-0=C2 … lucid-9=C5).
    bars.sort((a, b) => lucidVoicePitch(a) - lucidVoicePitch(b) || String(a.pathId || "").localeCompare(String(b.pathId || "")));

    const n = Math.max(1, bars.length);
    const marginX = w * 0.07;
    const span = w - marginX * 2;
    const topY = h * 0.12;
    // Visible shaft floor — physics contact Y equals this (mass rests on sill).
    const floorY = h * 0.82;
    const colW = span / n;
    const shaftHalf = Math.max(10, Math.min(colW * 0.42, w * 0.038));
    const cubeSize = Math.max(10, Math.min(shaftHalf * 0.78, h * 0.034));
    const contact0 = lucidCubeContact(cubeSize); // flash-invariant
    const meetEps = Math.max(3, cubeSize * 0.35);
    const travel = Math.max(48, floorY - topY - contact0);
    const playing = !!state.playing;
    // layoutKey bump after mass-on-sill + no-bass-draw fix.
    const layoutKey = (w | 0) + "x" + (h | 0) + ":" + (floorY | 0) + ":shaft8";

    const travelers = [];
    const processVoice = (v, colIndex) => {
      const period = Math.max(0.18, voicePeriodSec(v));
      const height = travel * 0.92;
      const gravity = (8 * height) / (period * period);
      const vLaunch = gravity * period * 0.5;
      const x = marginX + colW * (colIndex + 0.5);
      const edgeRgb = lucidToneRgb(v);
      // _lucidY = visible mass resting Y (flush with shaft sill when landed).
      const minBottom = topY + contact0 + cubeSize * 0.15;

      if (v._lucidLayout !== layoutKey || v._lucidY == null || !isFinite(v._lucidY)) {
        const phase = ((v.phase || 0) % 1 + 1) % 1;
        v._lucidY = minBottom + height * (0.12 + phase * 0.55 + (colIndex % 3) * 0.08);
        v._lucidVy = gravity * period * (0.05 + phase * 0.15);
        v._lucidStickUntil = 0;
        v._lucidPlanted = false;
        v._lucidLayout = layoutKey;
      }

      // Stick on sill while hit is visually active so screenshots show mass flush on floor.
      const flashNow = v._flash || 0;
      const stickUntil = v._lucidStickUntil || 0;
      let sticking = !!v._lucidPlanted && ((stickUntil > 0 && nowMs < stickUntil) || flashNow > 0.25);

      if (sticking) {
        // Hold pinned — no gravity / no rebound until sticky ends.
        v._lucidY = floorY;
        v._lucidVy = 0;
      } else if (playing && dt > 0) {
        // Sticky just ended while still on sill: launch once, then integrate.
        if (v._lucidPlanted && v._lucidY >= floorY - 1) {
          v._lucidPlanted = false;
          v._lucidStickUntil = 0;
          v._lucidVy = -vLaunch * (0.88 + (colIndex % 5) * 0.018);
        }
        v._lucidVy += gravity * dt;
        v._lucidY += v._lucidVy * dt;
      }

      // Soft ceiling — silent (tops do not emit).
      if (v._lucidY < minBottom) {
        v._lucidY = minBottom;
        if (v._lucidVy < 0) v._lucidVy *= -0.15;
      }

      let floorHit = false;
      if (v._lucidY >= floorY) {
        v._lucidY = floorY; // mass flush on shaft sill
        if (sticking || v._lucidPlanted) {
          v._lucidVy = 0; // stay planted; do not re-trigger floorHit
        } else if (v._lucidVy > 0 || Math.abs(v._lucidVy) < 8) {
          // Fresh contact: pin ~150ms / while flash>0.25, then launch.
          floorHit = true;
          v._lucidVy = 0;
          v._lucidStickUntil = nowMs + 150;
          v._lucidPlanted = true;
          sticking = true;
        }
      }

      const y = v._lucidY;
      // Debug: when landed, mass resting Y === floorY for every column (delta 0).
      v._lucidSillDelta = y - floorY;
      const side = (floorHit || y >= floorY - meetEps) ? 1 : -1;
      const orbPhase = period > 0 ? (((t / period) + (v.phase || 0)) % 1 + 1) % 1 : 0;
      v._orbPhase = orbPhase;
      v._gatePhase = 0.5;
      v._orbX = x;
      v._orbY = y - contact0; // visual center
      v._gateSide = side;
      v._lucidEdgeRgb = edgeRgb;
      if (typeof publishPitchHint === "function") publishPitchHint(v);
      if (typeof onGateSideSample === "function" && onGateSideSample(v, side)) {
        v._flashX = x;
        v._flashY = floorY;
        if (!v.mute) spawnLucidPulse(v, x, floorY, edgeRgb);
      }
      travelers.push({ v, x, y, colIndex, edgeRgb });
    };

    for (let i = 0; i < bars.length; i++) processVoice(bars[i], i);
    // Bass is audio-only (side-chained from bar hits) — never draw a second glass cube.

    if (sampleOnly) return;

    const struct = Math.min(1, lucidStructFlash);
    const frameL = marginX;
    const frameR = marginX + span;
    g.globalCompositeOperation = "source-over";

    // Whole-structure pulse wash — clipped to shaft frame, stops at sill (no underhang).
    if (struct > 0.02) {
      g.save();
      g.beginPath();
      g.rect(frameL, topY, span, floorY - topY);
      g.clip();
      const wash = g.createLinearGradient(0, topY, 0, floorY);
      wash.addColorStop(0, "rgba(200,230,255," + (0.03 + struct * 0.1) + ")");
      wash.addColorStop(0.55, "rgba(220,240,255," + (0.05 + struct * 0.16) + ")");
      wash.addColorStop(1, "rgba(255,252,245," + (0.12 + struct * 0.38) + ")");
      g.fillStyle = wash;
      g.fillRect(frameL, topY, span, floorY - topY);
      g.restore();
    }

    // Crystal shafts — cubes bounce inside these. Floor = bottom of each shaft.
    for (let i = 0; i < n; i++) {
      const x = marginX + colW * (i + 0.5);
      const bar = bars[i];
      drawLucidCrystalShaft(g, x, topY, floorY, shaftHalf, bar ? lucidToneRgb(bar) : [150, 180, 230], struct);
    }

    // Hit pulses: origin column + full-structure flood — clipped, no spill past sill/right.
    g.save();
    g.beginPath();
    g.rect(frameL, topY, span, floorY - topY);
    g.clip();
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < lucidPulses.length; i++) {
      const p = lucidPulses[i];
      const u = Math.max(0, p.life / p.max);
      const a = u * u;
      const pulseRgb = p.edge || [180, 210, 255];
      const flood = g.createLinearGradient(frameL, topY, frameR, floorY);
      flood.addColorStop(0, lucidRgba(pulseRgb, 0.04 * a));
      flood.addColorStop(0.5, lucidRgba(pulseRgb, 0.14 * a));
      flood.addColorStop(1, lucidRgba(pulseRgb, 0.28 * a));
      g.fillStyle = flood;
      g.fillRect(frameL, topY, span, floorY - topY);
      // Sill brighten ON floorY only — inside each shaft, no underhang band.
      for (let c = 0; c < n; c++) {
        const sx = marginX + colW * (c + 0.5);
        const lip = g.createRadialGradient(sx, floorY, 1, sx, floorY, shaftHalf * 1.15);
        lip.addColorStop(0, lucidRgba(pulseRgb, 0.55 * a));
        lip.addColorStop(0.55, lucidRgba(pulseRgb, 0.18 * a));
        lip.addColorStop(1, lucidRgba(pulseRgb, 0));
        g.fillStyle = lip;
        g.fillRect(sx - shaftHalf, floorY - 3, shaftHalf * 2, 3);
        const shaftLight = g.createLinearGradient(sx, topY, sx, floorY);
        shaftLight.addColorStop(0, lucidRgba(pulseRgb, 0));
        shaftLight.addColorStop(0.6, lucidRgba(pulseRgb, 0.1 * a));
        shaftLight.addColorStop(1, lucidRgba(pulseRgb, 0.35 * a));
        g.fillStyle = shaftLight;
        g.fillRect(sx - shaftHalf * 0.85, topY, shaftHalf * 1.7, floorY - topY);
      }
      // Origin bloom — clipped to origin shaft only, fully above sill (no floorY-22 spill band).
      const bloomR = Math.min(shaftHalf * 1.35, colW * 0.95) * (0.7 + (1 - u) * 0.45);
      g.save();
      g.beginPath();
      g.rect(p.x - shaftHalf, topY, shaftHalf * 2, floorY - topY);
      g.clip();
      const grd = g.createRadialGradient(p.x, floorY, 1, p.x, floorY, bloomR);
      grd.addColorStop(0, lucidRgba(pulseRgb, 0.65 * a));
      grd.addColorStop(0.45, lucidRgba(pulseRgb, 0.2 * a));
      grd.addColorStop(1, lucidRgba(pulseRgb, 0));
      g.fillStyle = grd;
      g.fillRect(p.x - shaftHalf, floorY - bloomR, shaftHalf * 2, bloomR);
      g.restore();
    }
    g.restore();

    const drawOrder = travelers.slice().sort((a, b) => a.y - b.y);
    for (let i = 0; i < drawOrder.length; i++) {
      const { v, x, y, edgeRgb } = drawOrder[i];
      const flash = Math.min(v._flash || 0, 1);
      // y is mass resting plane — cube sits flush on shaft sill when y === floorY.
      drawLucidGlassCube(g, x, y, cubeSize, edgeRgb, flash, !!v.mute);
    }

    g.globalCompositeOperation = "source-over";
  }


  function gateRgb(hex) {
    const h = toHex(hex).slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function gateMix(a, b, t) {
    const u = Math.max(0, Math.min(1, t));
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  }

  function gateRgba(rgb, a) {
    return "rgba(" + (rgb[0] | 0) + "," + (rgb[1] | 0) + "," + (rgb[2] | 0) + "," + a + ")";
  }

  // Looks follow Audio's _pitch01 / _pitchBand (publishPitchHint). No second pitch curve.
  function gateLook(v) {
    if (typeof publishPitchHint === "function") publishPitchHint(v);
    const p = Math.max(0, Math.min(1, v._pitch01 || 0));
    const band = v._pitchBand === "low" || v._pitchBand === "high" ? v._pitchBand : "mid";
    const vol = Math.max(0, Math.min(1, v.volume ?? 0.55));
    const wave = v.waveform || "sine";
    const simp = effectiveSimplicity(v);
    const base = gateRgb(v.color);
    const warm = [176, 84, 42];
    const deep = [16, 14, 28];
    const light = [238, 246, 255];
    let rgb = base;
    if (band === "low") rgb = gateMix(gateMix(base, warm, 0.55), deep, 0.34);
    else if (band === "high") rgb = gateMix(base, light, 0.5 + p * 0.28);
    else rgb = gateMix(base, light, 0.1 + p * 0.16);
    return { p, band, vol, wave, simp, rgb };
  }

  function gateTrim(arr, cap) {
    if (arr.length > cap) arr.splice(0, arr.length - cap);
  }

  // A double shock ring + B radial sparks always. C smoke on low/pad/kick. D gate flare on high/bell.
  function spawnGateHit(v, gx, y) {
    const look = gateLook(v);
    const band = look.band;
    const wave = look.wave;
    const vol = look.vol;
    const slow = band === "low";
    const fast = band === "high";
    const life = slow ? 0.92 : fast ? 0.34 : 0.55;
    const grow = (slow ? 148 : fast ? 64 : 102) * (0.72 + vol * 0.55);
    let width = wave === "kick" ? 6.2 : (wave === "sine" || wave === "triangle") ? 1.35 : wave === "bell" ? 1.05 : 2.25;
    if (slow && wave !== "sine" && wave !== "bell") width *= 1.45;
    if (fast) width *= 0.72;
    width *= 0.65 + vol * 0.7;
    const ringA = 0.42 + vol * 0.4;
    gatePulses.push({ kind: "ring", x: gx, y, life, max: life, delay: 0, grow, r0: 5, rgb: look.rgb, width, alpha: ringA });
    const life2 = life * 0.82;
    gatePulses.push({
      kind: "ring", x: gx, y, life: life2, max: life2,
      delay: slow ? 0.09 : fast ? 0.04 : 0.065,
      grow: grow * (slow ? 0.78 : 0.7), r0: 3, rgb: look.rgb, width: width * 0.62, alpha: ringA * 0.75,
    });
    gateTrim(gatePulses, 28);

    let n = Math.round(6 + vol * 13);
    if (wave === "bell") n += 7;
    if (wave === "noise") n += 4;
    if (wave === "saw" || wave === "square") n += 2;
    if (wave === "pad") n = Math.round(n * 0.4);
    if (wave === "kick") n = Math.round(n * 0.65);
    if (look.simp > 0.82) n = Math.round(n * 0.55);
    const room = Math.max(0, 80 - gateSparks.length);
    n = Math.min(n, room);
    const speed = (fast ? 175 : slow ? 52 : 98) * (0.68 + vol * 0.55);
    const slife = (fast ? 0.18 : slow ? 0.4 : 0.27) * (wave === "bell" ? 0.72 : 1);
    for (let i = 0; i < n; i++) {
      const jitter = wave === "noise" ? ((i * 47) % 11) / 11 * 0.7 : wave === "bell" ? 0.015 : 0.1;
      const ang = (i / Math.max(1, n)) * Math.PI * 2 + jitter + (v.id || 0) * 0.13;
      const sp = speed * (0.45 + ((i * 13) % 10) / 14);
      const sharp = wave === "bell" || wave === "square";
      gateSparks.push({
        x: gx, y,
        vx: Math.cos(ang) * sp * (wave === "kick" ? 0.55 : 1),
        vy: Math.sin(ang) * sp * (wave === "kick" ? 0.45 : 1),
        life: slife * (0.65 + (i % 5) * 0.07),
        max: slife,
        rgb: look.rgb,
        w: sharp ? 0.85 : wave === "kick" ? 2.7 : slow ? 1.8 : 1.15,
      });
    }

    const wantSmoke = slow || wave === "pad" || wave === "kick";
    if (wantSmoke) {
      const m = wave === "pad" ? 6 : wave === "kick" ? 4 : 3;
      for (let i = 0; i < m && gateSmoke.length < 36; i++) {
        const smLife = slow ? 1.15 : 0.68;
        gateSmoke.push({
          x: gx + (i - (m - 1) / 2) * 3,
          y,
          vx: (i - (m - 1) / 2) * (slow ? 8 : 14),
          vy: (i % 2 === 0 ? -1 : 1) * (slow ? 16 : 28),
          r: (slow ? 16 : 9) + vol * 8 + (wave === "pad" ? 6 : 0),
          life: smLife,
          max: smLife,
          rgb: look.rgb,
          seed: (v.id || 1) * 1.7 + i * 2.1,
          turb: slow ? 26 : 14,
        });
      }
    }

    if (fast || wave === "bell") {
      const flife = 0.2 + look.p * 0.12;
      const len = 32 + look.p * 78 + (wave === "bell" ? 18 : 0);
      gatePulses.push({ kind: "flare", x: gx, y, dir: -1, len, life: flife, max: flife, rgb: look.rgb, alpha: 0.45 + vol * 0.45 });
      gatePulses.push({ kind: "flare", x: gx, y, dir: 1, len, life: flife, max: flife, rgb: look.rgb, alpha: 0.45 + vol * 0.45 });
      gateTrim(gatePulses, 28);
    }
  }

  function tickGateFx(dt) {
    for (let i = gatePulses.length - 1; i >= 0; i--) {
      const o = gatePulses[i];
      if (o.delay > 0) {
        o.delay -= dt;
        continue;
      }
      o.life -= dt;
      if (o.life <= 0) gatePulses.splice(i, 1);
    }
    for (let i = gateSparks.length - 1; i >= 0; i--) {
      const o = gateSparks[i];
      o.life -= dt;
      if (o.life <= 0) { gateSparks.splice(i, 1); continue; }
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      const drag = 1 - Math.min(0.45, dt * 1.6);
      o.vx *= drag;
      o.vy *= drag;
    }
    for (let i = gateSmoke.length - 1; i >= 0; i--) {
      const o = gateSmoke[i];
      o.life -= dt;
      if (o.life <= 0) { gateSmoke.splice(i, 1); continue; }
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vx += Math.sin(o.seed + o.life * 8) * dt * o.turb;
      o.vy += Math.cos(o.seed * 1.3 + o.life * 5) * dt * o.turb * 0.85;
    }
  }

  function drawGateFx(g) {
    g.save();
    g.globalCompositeOperation = "lighter";
    g.lineCap = "round";
    for (let i = 0; i < gateSmoke.length; i++) {
      const o = gateSmoke[i];
      const u = 1 - o.life / o.max;
      const a = (1 - u) * (1 - u) * 0.22;
      g.fillStyle = gateRgba(o.rgb, a);
      g.beginPath();
      g.arc(o.x, o.y, o.r * (0.7 + u * 0.9), 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < gatePulses.length; i++) {
      const o = gatePulses[i];
      if (o.delay > 0) continue;
      const u = 1 - o.life / o.max;
      if (o.kind === "flare") {
        const reach = o.len * (0.2 + u * 0.85);
        const a = o.alpha * (1 - u);
        g.strokeStyle = gateRgba(o.rgb, a);
        g.lineWidth = 3.2 * (1 - u) + 0.6;
        g.beginPath();
        g.moveTo(o.x, o.y);
        g.lineTo(o.x, o.y + o.dir * reach);
        g.stroke();
        g.strokeStyle = gateRgba([255, 255, 255], a * 0.55);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(o.x, o.y);
        g.lineTo(o.x, o.y + o.dir * reach * 0.72);
        g.stroke();
      } else {
        const rad = o.r0 + o.grow * u;
        g.strokeStyle = gateRgba(o.rgb, o.alpha * (1 - u));
        g.lineWidth = Math.max(0.4, o.width * (1 - u * 0.75));
        g.beginPath();
        g.arc(o.x, o.y, rad, 0, Math.PI * 2);
        g.stroke();
      }
    }
    for (let i = 0; i < gateSparks.length; i++) {
      const o = gateSparks[i];
      const u = 1 - o.life / o.max;
      const a = (1 - u) * 0.9;
      g.strokeStyle = gateRgba(o.rgb, a);
      g.lineWidth = o.w;
      const tail = 0.03 + u * 0.02;
      g.beginPath();
      g.moveTo(o.x, o.y);
      g.lineTo(o.x - o.vx * tail, o.y - o.vy * tail);
      g.stroke();
    }
    g.restore();
  }

  function drawLivingOrb(g, v, x, y, t) {
    const look = gateLook(v);
    const band = look.band;
    const flash = Math.min(v._flash || 0, 1);
    const tr = gateOrbTrails[v.id] || (gateOrbTrails[v.id] = []);
    const last = tr[tr.length - 1];
    if (!last || (last.x - x) * (last.x - x) + (last.y - y) * (last.y - y) > 0.36) tr.push({ x, y });
    const cap = band === "high" ? 7 : band === "low" ? 14 : 10;
    while (tr.length > cap) tr.shift();

    const breathHz = band === "low" ? 1.05 : band === "high" ? 2.6 : 1.7;
    const breath = 1 + Math.sin(t * breathHz + (v.id || 0)) * (band === "low" ? 0.09 : 0.05);
    const punch = 1 + flash * (0.32 + look.vol * 0.38);
    const R = (band === "low" ? 5.4 : band === "high" ? 3.3 : 4.2) * breath * punch;
    const spin = t * (band === "high" ? 2.4 : band === "low" ? 0.7 : 1.3) + (v._orbPhase || 0) * Math.PI * 2;
    const side = v._gateSide || 1;
    const ox = x + side * flash * (4 + look.vol * 7);
    const oy = y;

    g.save();
    g.globalCompositeOperation = "lighter";
    const trailW = band === "high" ? 0.35 : band === "low" ? 0.7 : 0.5;
    for (let i = 0; i < tr.length; i++) {
      const k = (i + 1) / tr.length;
      const a = k * k * (band === "high" ? 0.16 : band === "low" ? 0.07 : 0.1);
      g.fillStyle = gateRgba(look.rgb, a);
      g.beginPath();
      g.arc(tr[i].x, tr[i].y, R * trailW * (0.35 + k), 0, Math.PI * 2);
      g.fill();
    }
    const bloomR = R * (band === "low" ? 5.4 : band === "high" ? 3.1 : 4) * (1 + flash * 0.45);
    const grd = g.createRadialGradient(ox, oy, R * 0.15, ox, oy, bloomR);
    grd.addColorStop(0, gateRgba(look.rgb, (band === "low" ? 0.28 : 0.42) + flash * 0.35 + look.vol * 0.12));
    grd.addColorStop(0.45, gateRgba(look.rgb, band === "low" ? 0.12 : 0.08));
    grd.addColorStop(1, gateRgba(look.rgb, 0));
    g.fillStyle = grd;
    g.beginPath();
    g.arc(ox, oy, bloomR, 0, Math.PI * 2);
    g.fill();

    g.translate(ox, oy);
    g.scale(1 - flash * 0.2, 1 + flash * 0.26);
    g.rotate(spin);
    g.strokeStyle = gateRgba(band === "high" ? [255, 255, 255] : look.rgb, 0.4 + flash * 0.45);
    g.lineWidth = 1.15 + flash * 1.5;
    g.beginPath();
    g.arc(0, 0, R, -0.4, 2.15);
    g.stroke();
    for (let k = 0; k < 3; k++) {
      const a = k * (Math.PI * 2 / 3);
      g.fillStyle = gateRgba(look.rgb, 0.55 + look.p * 0.35);
      g.beginPath();
      g.arc(Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72, Math.max(0.7, R * 0.18), 0, Math.PI * 2);
      g.fill();
    }
    const core = band === "low" ? gateMix(look.rgb, [255, 214, 170], 0.4) : [255, 252, 255];
    g.fillStyle = gateRgba(core, band === "low" ? 0.72 : 0.92);
    g.beginPath();
    g.arc(0, 0, R * 0.34, 0, Math.PI * 2);
    g.fill();
    g.restore();

    if (flash > 0.04 && v._flashX != null) {
      g.save();
      g.globalCompositeOperation = "lighter";
      const rim = 7 + (1 - flash) * (band === "low" ? 22 : band === "high" ? 10 : 15);
      g.strokeStyle = gateRgba(look.rgb, 0.3 + flash * 0.6);
      g.lineWidth = 1.2 + flash * (band === "low" ? 4.5 : 2.2);
      g.beginPath();
      g.arc(v._flashX, v._flashY, rim, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
  }


  function gateLookOn(key) {
    return !!(state.gateLooks && state.gateLooks[key]);
  }

  const gateWakes = [];
  const gateWakePrev = {};
  const gateRipples = [];
  const etherImpulses = [];
  const gateBugs = [];
  let gateBugsReady = false;

  function tickGateAtmosphere(dt) {
    for (let i = gateWakes.length - 1; i >= 0; i--) {
      gateWakes[i].age += dt;
      if (gateWakes[i].age > 1.55) gateWakes.splice(i, 1);
    }
    for (let i = gateRipples.length - 1; i >= 0; i--) {
      gateRipples[i].life -= dt;
      if (gateRipples[i].life <= 0) gateRipples.splice(i, 1);
    }
    for (let i = etherImpulses.length - 1; i >= 0; i--) {
      etherImpulses[i].life -= dt;
      if (etherImpulses[i].life <= 0) etherImpulses.splice(i, 1);
    }
    if (!gateBugsReady) {
      gateBugsReady = true;
      const pal = [[70, 255, 235], [255, 70, 190], [255, 176, 80], [150, 210, 255]];
      for (let i = 0; i < 42; i++) {
        const s = (i + 1) * 1.618;
        gateBugs.push({
          u: (Math.sin(s * 2.1) * 0.5 + 0.5),
          v: (Math.cos(s * 1.4) * 0.5 + 0.5),
          vx: Math.sin(s * 0.7) * 62,
          vy: Math.cos(s * 0.9) * 40,
          ph: s,
          hz: 1.2 + (i % 7) * 0.45,
          rgb: pal[i % pal.length],
          r: 1.35 + (i % 4) * 0.45,
          px: 0,
          py: 0,
        });
      }
    }
    const w = Math.max(1, canvas().clientWidth);
    const h = Math.max(1, canvas().clientHeight);
    const bugNow = performance.now() / 1000;
    for (let i = 0; i < gateBugs.length; i++) {
      const b = gateBugs[i];
      b.vx += Math.sin(bugNow * 0.8 + b.ph) * dt * 22;
      b.vy += Math.cos(bugNow * 0.63 + b.ph * 1.3) * dt * 18;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const cap = 84;
      if (sp > cap) { b.vx *= cap / sp; b.vy *= cap / sp; }
      else if (sp < 32) { b.vx *= 32 / sp; b.vy *= 32 / sp; }
      b.u += (b.vx * dt) / w;
      b.v += (b.vy * dt) / h;
      if (b.u < 0) b.u += 1;
      if (b.u > 1) b.u -= 1;
      if (b.v < 0) b.v += 1;
      if (b.v > 1) b.v -= 1;
    }
  }

  function recordGateWakes(pts) {
    if (!gateLookOn("wake")) {
      Object.keys(gateWakePrev).forEach((id) => { delete gateWakePrev[id]; });
      return;
    }
    // Sample by distance traveled, not per-frame jump, so 90 Hz still leaves a wake.
    const STEP = 18;
    const live = {};
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const id = p.v.id;
      live[id] = 1;
      const prev = gateWakePrev[id];
      if (!prev) {
        gateWakePrev[id] = { x: p.x, y: p.y, acc: 0 };
        continue;
      }
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 220) {
        gateWakePrev[id] = { x: p.x, y: p.y, acc: 0 };
        continue;
      }
      if (dist < 0.2) {
        gateWakePrev[id] = { x: p.x, y: p.y, acc: prev.acc || 0 };
        continue;
      }
      let traveled = 0;
      let acc = prev.acc || 0;
      let placed = 0;
      while (acc + (dist - traveled) >= STEP && placed < 5) {
        const need = STEP - acc;
        traveled += need;
        acc = 0;
        const u = traveled / dist;
        gateWakes.push({
          x: prev.x + dx * u,
          y: prev.y + dy * u,
          dx: dx,
          dy: dy,
          age: 0,
        });
        placed++;
      }
      acc += dist - traveled;
      gateWakePrev[id] = { x: p.x, y: p.y, acc: acc };
    }
    Object.keys(gateWakePrev).forEach((id) => { if (!live[id]) delete gateWakePrev[id]; });
    if (gateWakes.length > 80) gateWakes.splice(0, gateWakes.length - 80);
  }

  function wakePush(x, y) {
    let ox = 0, oy = 0, tear = 0;
    if (!gateLookOn("wake")) return { ox, oy, tear };
    for (let i = 0; i < gateWakes.length; i++) {
      const wk = gateWakes[i];
      const dx = x - wk.x;
      const dy = y - wk.y;
      const d2 = dx * dx + dy * dy;
      const R = 150;
      if (d2 > R * R) continue;
      const d = Math.sqrt(d2) || 1;
      const fall = (1 - d / R) * (1 - wk.age / 1.55);
      const tl = Math.hypot(wk.dx, wk.dy) || 1;
      ox += (dx / d) * fall * 28;
      oy += (dy / d) * fall * 18;
      ox += (-wk.dy / tl) * fall * 46;
      oy += (wk.dx / tl) * fall * 26;
      tear += fall;
    }
    return { ox, oy, tear: Math.min(1.6, tear) };
  }

  function drawWakeMist(g) {
    // Wake alone: swirling vapor shed beside the path, not a stroke on it.
    g.save();
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < gateWakes.length; i++) {
      const wk = gateWakes[i];
      const fall = 1 - wk.age / 1.55;
      if (fall <= 0.05) continue;
      const tl = Math.hypot(wk.dx, wk.dy) || 1;
      const px = -wk.dy / tl;
      const py = wk.dx / tl;
      const spin = Math.sin(wk.age * 9 + i * 0.6) * 20;
      const side = (i % 2 === 0 ? 1 : -1);
      const ox = wk.x + px * (36 + spin) * side - (wk.dx / tl) * wk.age * 22;
      const oy = wk.y + py * (36 + spin) * side - (wk.dy / tl) * wk.age * 22;
      const rad = 26 + fall * 36;
      const grd = g.createRadialGradient(ox, oy, 0, ox, oy, rad);
      grd.addColorStop(0, "rgba(230,244,255," + (0.52 * fall) + ")");
      grd.addColorStop(0.38, "rgba(150,198,240," + (0.28 * fall) + ")");
      grd.addColorStop(1, "rgba(126,176,224,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(ox, oy, rad, rad * 0.42, Math.atan2(py, px) + wk.age * 3.1, 0, Math.PI * 2);
      g.fill();
      // Secondary curl opposite side so solo Wake still reads at a glance.
      const ox2 = wk.x + px * (18 + spin * 0.5) * -side - (wk.dx / tl) * wk.age * 10;
      const oy2 = wk.y + py * (18 + spin * 0.5) * -side - (wk.dy / tl) * wk.age * 10;
      const rad2 = 14 + fall * 18;
      const grd2 = g.createRadialGradient(ox2, oy2, 0, ox2, oy2, rad2);
      grd2.addColorStop(0, "rgba(200,224,255," + (0.28 * fall) + ")");
      grd2.addColorStop(1, "rgba(126,176,224,0)");
      g.fillStyle = grd2;
      g.beginPath();
      g.ellipse(ox2, oy2, rad2, rad2 * 0.36, Math.atan2(py, px) - wk.age * 2.4, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  function disturbGateClouds(g) {
    // Groove the cloud on the path and drop the torn vapor off to one side.
    g.save();
    for (let i = 0; i < gateWakes.length; i++) {
      const wk = gateWakes[i];
      const fall = 1 - wk.age / 1.55;
      if (fall <= 0.05) continue;
      const tl = Math.hypot(wk.dx, wk.dy) || 1;
      const px = -wk.dy / tl;
      const py = wk.dx / tl;
      const spin = Math.sin(wk.age * 7 + i * 0.8) * 16;
      const side = (i % 2 === 0 ? 1 : -1);
      const groove = 30 + fall * 28;
      const hole = g.createRadialGradient(wk.x, wk.y, groove * 0.1, wk.x, wk.y, groove);
      hole.addColorStop(0, "rgba(2,3,8," + (0.94 * fall) + ")");
      hole.addColorStop(0.55, "rgba(2,3,8," + (0.45 * fall) + ")");
      hole.addColorStop(1, "rgba(2,3,8,0)");
      g.fillStyle = hole;
      g.beginPath();
      g.ellipse(wk.x, wk.y, groove, groove * 0.58, Math.atan2(wk.dy, wk.dx), 0, Math.PI * 2);
      g.fill();
      const ox = wk.x + px * (34 + spin) * side - (wk.dx / tl) * 14;
      const oy = wk.y + py * (34 + spin) * side - (wk.dy / tl) * 14;
      const rad = 26 + fall * 32;
      const grd = g.createRadialGradient(ox, oy, 0, ox, oy, rad);
      grd.addColorStop(0, "rgba(230,242,255," + (0.58 * fall) + ")");
      grd.addColorStop(0.45, "rgba(170,200,236," + (0.24 * fall) + ")");
      grd.addColorStop(1, "rgba(156,186,220,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(ox, oy, rad * 1.18, rad * 0.5, Math.atan2(py, px) + wk.age * 2.2, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  function drawGateClouds(g, w, h, t) {
    const clouds = gateLookOn("clouds");
    const wake = gateLookOn("wake");
    if (!clouds && !wake) return;
    if (!clouds) { drawWakeMist(g); return; }
    g.save();
    const seeds = [
      [0.16, 0.2, 0.32, 0.15, 0.12, 0],
      [0.42, 0.14, 0.26, 0.12, 0.08, 1.2],
      [0.74, 0.22, 0.36, 0.16, 0.1, 2.1],
      [0.28, 0.46, 0.34, 0.16, 0.09, 3.3],
      [0.58, 0.4, 0.4, 0.18, 0.11, 1.7],
      [0.84, 0.58, 0.28, 0.14, 0.08, 4.2],
      [0.18, 0.72, 0.3, 0.14, 0.09, 2.6],
      [0.5, 0.76, 0.36, 0.16, 0.1, 0.8],
      [0.78, 0.82, 0.26, 0.12, 0.07, 5.1],
      [0.34, 0.3, 0.2, 0.1, 0.06, 1.1],
      [0.62, 0.62, 0.3, 0.13, 0.08, 2.8],
      [0.1, 0.5, 0.22, 0.12, 0.07, 4.6],
    ];
    const lobes = [[0, 0, 1], [-0.34, 0.06, 0.62], [0.3, -0.1, 0.55]];
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const driftX = Math.sin(t * (0.05 + s[4] * 0.15) + s[5]) * w * 0.035;
      const driftY = Math.cos(t * (0.035 + s[4] * 0.12) + s[5] * 1.3) * h * 0.02;
      const bx = s[0] * w + driftX;
      const by = s[1] * h + driftY;
      const push = wakePush(bx, by);
      const cx = bx + push.ox;
      const cy = by + push.oy;
      const rx = s[2] * w * (1 + push.tear * 0.22);
      const ry = s[3] * h * (1 - Math.min(0.35, push.tear * 0.18));
      const baseA = 0.22 * (1 - Math.min(0.55, push.tear * 0.28));
      for (let L = 0; L < lobes.length; L++) {
        const lobe = lobes[L];
        const lx = cx + rx * lobe[0];
        const ly = cy + ry * lobe[1];
        const sc = lobe[2];
        const a = baseA * (L === 0 ? 1 : 0.72);
        const rad = Math.max(rx, ry) * sc;
        const grd = g.createRadialGradient(lx - rx * 0.12, ly - ry * 0.08, 6, lx, ly, Math.max(12, rad));
        grd.addColorStop(0, "rgba(214,228,244," + a + ")");
        grd.addColorStop(0.55, "rgba(148,176,210," + (a * 0.55) + ")");
        grd.addColorStop(1, "rgba(90,120,160,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.ellipse(lx, ly, Math.max(10, rx * sc), Math.max(8, ry * sc), push.tear * 0.55, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
    if (wake) disturbGateClouds(g);
  }

  function traceRoundRect(g, x, y, rw, rh, r) {
    const rr = Math.min(r, rw * 0.5, rh * 0.5);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.arcTo(x + rw, y, x + rw, y + rh, rr);
    g.arcTo(x + rw, y + rh, x, y + rh, rr);
    g.arcTo(x, y + rh, x, y, rr);
    g.arcTo(x, y, x + rw, y, rr);
    g.closePath();
  }

  function paintGlassPane(g, x, y, rw, rh, t, seed) {
    g.save();
    // Soft outer glow so the panel silhouette reads on a dark stage.
    g.shadowColor = "rgba(170,210,255,0.35)";
    g.shadowBlur = 18;
    traceRoundRect(g, x, y, rw, rh, 18);
    g.fillStyle = "rgba(120,170,220,0.08)";
    g.fill();
    g.shadowBlur = 0;
    traceRoundRect(g, x, y, rw, rh, 18);
    g.clip();
    const body = g.createLinearGradient(x, y, x + rw, y + rh);
    body.addColorStop(0, "rgba(236,248,255,0.48)");
    body.addColorStop(0.38, "rgba(164,200,240,0.2)");
    body.addColorStop(0.7, "rgba(110,158,210,0.16)");
    body.addColorStop(1, "rgba(70,120,180,0.34)");
    g.fillStyle = body;
    g.fillRect(x, y, rw, rh);
    const sheenY = y + ((t * 28 + seed * 60) % (rh + 80)) - 36;
    const sheen = g.createLinearGradient(x, sheenY, x + rw * 0.55, sheenY + 64);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.5, "rgba(255,255,255,0.68)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = sheen;
    g.fillRect(x, sheenY, rw, 48);
    const edge = g.createLinearGradient(x, y, x + 22, y);
    edge.addColorStop(0, "rgba(255,255,255,0.38)");
    edge.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = edge;
    g.fillRect(x, y, 20, rh);
    // Inner frost mottling — still glass, not a solid slab.
    for (let i = 0; i < 5; i++) {
      const fx = x + rw * (0.18 + (i * 0.17 + seed * 0.05) % 0.62);
      const fy = y + rh * (0.12 + ((i * 0.29 + seed * 0.13) % 0.76));
      const fr = Math.min(rw, rh) * (0.12 + (i % 3) * 0.04);
      const frost = g.createRadialGradient(fx, fy, 0, fx, fy, fr);
      frost.addColorStop(0, "rgba(255,255,255,0.14)");
      frost.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = frost;
      g.beginPath();
      g.arc(fx, fy, fr, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    traceRoundRect(g, x, y, rw, rh, 18);
    g.strokeStyle = "rgba(242,250,255,0.88)";
    g.lineWidth = 1.8;
    g.stroke();
    g.strokeStyle = "rgba(8,16,32,0.5)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + rw - 1.5, y + 16);
    g.lineTo(x + rw - 1.5, y + rh - 16);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.82)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(x + 16, y + 2);
    g.lineTo(x + rw * 0.68, y + 2);
    g.stroke();
  }

  function drawGateGlass(g, w, h, t) {
    const paneW = Math.max(52, Math.min(132, w * 0.1));
    const paneH = h * 0.7;
    const y = h * 0.09;
    paintGlassPane(g, 14, y, paneW, paneH, t, 0);
    paintGlassPane(g, w - paneW - 14, y, paneW, paneH, t, 2.6);
  }

  function drawGateReflections(g, w, h, pts) {
    const floor = h * 0.84;
    g.save();
    const band = g.createLinearGradient(0, floor - 18, 0, h);
    band.addColorStop(0, "rgba(186,214,245,0)");
    band.addColorStop(0.1, "rgba(200,226,252,0.34)");
    band.addColorStop(0.45, "rgba(120,170,220,0.14)");
    band.addColorStop(1, "rgba(70,110,160,0.1)");
    g.fillStyle = band;
    g.fillRect(0, floor - 14, w, h - floor + 14);
    // Floor glass edge — bright enough to read as a mirror plane.
    g.strokeStyle = "rgba(236,246,255,0.78)";
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(w * 0.05, floor);
    g.lineTo(w * 0.95, floor);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.42)";
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(w * 0.08, floor + 2);
    g.lineTo(w * 0.55, floor + 2);
    g.stroke();
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const look = gateLook(p.v);
      const above = Math.max(0, floor - p.y);
      const depth = Math.min(78, 18 + above * 0.18);
      const ry = floor + depth * 0.46;
      const a = 0.48 + look.vol * 0.36;
      const rad = 20 + Math.min(22, above * 0.05);
      const grd = g.createRadialGradient(p.x, ry, 1, p.x, ry, rad * 1.7);
      grd.addColorStop(0, gateRgba(look.rgb, Math.min(0.95, a)));
      grd.addColorStop(0.45, gateRgba(look.rgb, a * 0.4));
      grd.addColorStop(1, gateRgba(look.rgb, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(p.x, ry, rad, Math.max(6, rad * 0.3), 0, 0, Math.PI * 2);
      g.fill();
      // Soft drop from orb to mirror puddle.
      g.strokeStyle = gateRgba(look.rgb, a * 0.45);
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(p.x, Math.min(floor, p.y + 6));
      g.lineTo(p.x, ry);
      g.stroke();
    }
    g.restore();
  }


  function drawSharedGateLine(g, gx, h) {
    g.save();
    g.strokeStyle = "rgba(214,230,255,0.8)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(gx, 0);
    g.lineTo(gx, h);
    g.stroke();
    g.restore();
  }

  function spawnEtherImpulse(v, gx, y, orbX) {
    if (!gateLookOn("gateGlass")) return;
    const rgb = gateLook(v).rgb;
    etherImpulses.push({
      x: gx,
      y: y,
      cx: orbX,
      cy: y,
      rgb: rgb,
      life: 0.9,
      max: 0.9,
    });
    if (etherImpulses.length > 16) etherImpulses.splice(0, etherImpulses.length - 16);
  }

  // Liquid figure. Resting shape is fixed. Motion is only hit impulses.
  function etherGeom(y, h) {
    const u = y / Math.max(1, h);
    let disp = Math.sin(u * Math.PI * 3) * 12 + Math.sin(u * Math.PI * 8) * 4;
    let slope = Math.cos(u * Math.PI * 3) * 12 * Math.PI * 3 / h
      + Math.cos(u * Math.PI * 8) * 4 * Math.PI * 8 / h;
    for (let i = 0; i < etherImpulses.length; i++) {
      const imp = etherImpulses[i];
      const age = 1 - imp.life / imp.max;
      const sigma = 16 + age * 28;
      const amp = (imp.life / imp.max) * 16;
      const k = 0.11;
      const travel = age * h * 0.55;
      for (let dir = -1; dir <= 1; dir += 2) {
        const d = y - (imp.y + dir * travel);
        const env = Math.exp(-(d * d) / (sigma * sigma));
        const phase = d * k;
        disp += Math.sin(phase) * env * amp;
        const denv = env * (-2 * d / (sigma * sigma));
        slope += (Math.cos(phase) * k * env + Math.sin(phase) * denv) * amp;
      }
    }
    return { disp: disp, slope: slope };
  }

  function etherMirror(x, y, slope, carrier) {
    const ang = Math.atan(slope * 8);
    const Nx = Math.sin(ang);
    const Nz = Math.cos(ang);
    const dx = carrier.x - x;
    const dy = carrier.y - y;
    const dz = carrier.z;
    const llen = Math.hypot(dx, dy, dz) || 1;
    const ix = -dx / llen;
    const iy = -dy / llen;
    const iz = -dz / llen;
    const ndi = Nx * ix + Nz * iz;
    const rx = ix - 2 * ndi * Nx;
    const rz = iz - 2 * ndi * Nz;
    const fall = Math.max(0.45, 1 - Math.hypot(dx, dy) / 1100);
    return Math.max(0, rz) * Math.exp(-(rx * rx + iy * iy) * 12) * fall * carrier.w;
  }

  function etherCarriers(gx, h) {
    const list = [];
    state.voices.forEach((v) => {
      if (v._orbX == null) return;
      const look = gateLook(v);
      const flash = Math.min(1, v._flash || 0);
      list.push({
        x: v._orbX,
        y: v._orbY,
        z: 44,
        rgb: look.rgb,
        w: 1.05 + flash * 2.8,
      });
    });
    // The interface itself is a carrier: a few samples down the shared line.
    for (let i = 0; i < 3; i++) {
      list.push({
        x: gx,
        y: h * (0.22 + 0.56 * (i / 2)),
        z: 34,
        rgb: [210, 228, 255],
        w: 0.32,
      });
    }
    if (gateLookOn("bugs")) {
      const w = Math.max(1, canvas().clientWidth);
      const hh = Math.max(1, canvas().clientHeight);
      for (let i = 0; i < gateBugs.length; i += 3) {
        const b = gateBugs[i];
        list.push({ x: b.u * w, y: b.v * hh, z: 64, rgb: b.rgb, w: 0.4 });
      }
    }
    return list;
  }

  function paintEtherSpecular(out, bw, bh, xDev, yDev, rgb, amount) {
    if (amount < 0.04) return;
    const rad = 1.35;
    const x0 = Math.max(0, Math.floor(xDev - 3));
    const x1 = Math.min(bw - 1, Math.ceil(xDev + 3));
    const y0 = Math.max(0, Math.floor(yDev - 5));
    const y1 = Math.min(bh - 1, Math.ceil(yDev + 5));
    for (let y = y0; y <= y1; y++) {
      const dy = y - yDev;
      for (let x = x0; x <= x1; x++) {
        const dx = x - xDev;
        // Sharp filament: tight in x, a few backing pixels tall.
        const m = Math.exp(-(dx * dx) / (rad * rad) - (dy * dy) / 18);
        if (m < 0.06) continue;
        const di = (y * bw + x) * 4;
        const k = amount * m;
        const peak = Math.max(rgb[0], rgb[1], rgb[2], 1);
        const boost = 255 / peak;
        out[di] = Math.min(255, out[di] + rgb[0] * boost * k);
        out[di + 1] = Math.min(255, out[di + 1] + rgb[1] * boost * k);
        out[di + 2] = Math.min(255, out[di + 2] + rgb[2] * boost * k);
      }
    }
  }

  function drawEtherField(g, gx, h) {
    const canvasEl = g.canvas;
    const tr = g.getTransform();
    const sx = tr.a || 1;
    const sy = tr.d || 1;
    const padCss = 64;
    const x0 = Math.max(0, Math.floor((gx - padCss) * sx));
    const x1 = Math.min(canvasEl.width, Math.ceil((gx + padCss) * sx));
    const bw = x1 - x0;
    const bh = canvasEl.height;
    if (bw < 8 || bh < 8) return;
    let img = null;
    try { img = g.getImageData(x0, 0, bw, bh); } catch (_) { img = null; }
    if (!img) return;
    const src = img.data;
    const out = new Uint8ClampedArray(src);
    const cx = (gx * sx) - x0;
    const carriers = etherCarriers(gx, h);
    const best = [];
    for (let i = 0; i < carriers.length; i++) best.push([-1, -1]);
    for (let y = 0; y < bh; y++) {
      const yCss = y / sy;
      const geom = etherGeom(yCss, h);
      const half = (20 + geom.disp * 0.35) * sx;
      const yShift = geom.slope * 10 * sy;
      let syf = y + yShift;
      if (syf < 0) syf = 0;
      else if (syf > bh - 1.001) syf = bh - 1.001;
      const yA = syf | 0;
      const yB = yA + 1 < bh ? yA + 1 : yA;
      const fy = syf - yA;
      const row = y * bw;
      const rowA = yA * bw;
      const rowB = yB * bw;
      const xStart = Math.max(0, (cx - Math.abs(half) - 8) | 0);
      const xEnd = Math.min(bw - 1, Math.ceil(cx + Math.abs(half) + 8));
      for (let x = xStart; x <= xEnd; x++) {
        const nx = half !== 0 ? (x - cx) / (Math.abs(half) + 8) : 0;
        const ax = nx < 0 ? -nx : nx;
        if (ax >= 1) continue;
        const edge = 1 - ax;
        const m = edge * edge * (3 - 2 * edge);
        const bulge = 1 - nx * nx;
        let sampleX = cx + (x - cx) * (1 - bulge * 0.42) + geom.slope * bulge * 14 * sx;
        if (sampleX < 0) sampleX = 0;
        else if (sampleX > bw - 1.001) sampleX = bw - 1.001;
        const sx0 = sampleX | 0;
        const fx = sampleX - sx0;
        const sx1 = sx0 + 1 < bw ? sx0 + 1 : sx0;
        const di = (row + x) * 4;
        for (let c = 0; c < 3; c++) {
          const s00 = src[(rowA + sx0) * 4 + c];
          const s10 = src[(rowA + sx1) * 4 + c];
          const s01 = src[(rowB + sx0) * 4 + c];
          const s11 = src[(rowB + sx1) * 4 + c];
          const v = (s00 + (s10 - s00) * fx) * (1 - fy) + (s01 + (s11 - s01) * fx) * fy;
          out[di + c] = src[di + c] + (v - src[di + c]) * m;
        }
      }
      for (let i = 0; i < carriers.length; i++) {
        const carrier = carriers[i];
        for (let s = 0; s < 2; s++) {
          const side = s === 0 ? -1 : 1;
          const xCss = gx + side * (22 + geom.disp * 0.45);
          const shine = etherMirror(xCss, yCss, side * geom.slope, carrier);
          if (shine > best[i][s]) best[i][s] = shine;
        }
      }
    }
    for (let i = 0; i < carriers.length; i++) {
      const carrier = carriers[i];
      for (let s = 0; s < 2; s++) {
        const side = s === 0 ? -1 : 1;
        let peak = 0;
        let peakY = 0;
        const step = Math.max(1, (sy | 0));
        for (let y = 0; y < bh; y += step) {
          const yCss = y / sy;
          const geom = etherGeom(yCss, h);
          const xCss = gx + side * (22 + geom.disp * 0.45);
          const shine = etherMirror(xCss, yCss, side * geom.slope, carrier);
          if (shine > peak) { peak = shine; peakY = y; }
        }
        if (peak < 0.08) continue;
        const yCss = peakY / sy;
        const geom = etherGeom(yCss, h);
        const xCss = gx + side * (22 + geom.disp * 0.45);
        const xDev = xCss * sx - x0;
        paintEtherSpecular(out, bw, bh, xDev, peakY, carrier.rgb, Math.min(7, 1.4 + peak * 4.2));
      }
    }
    // Outward shimmer of each hit: sharp crest riding the impulse, carrier color from the cross.
    for (let i = 0; i < etherImpulses.length; i++) {
      const imp = etherImpulses[i];
      const age = 1 - imp.life / imp.max;
      const travel = age * h * 0.55;
      const fade = imp.life / imp.max;
      for (let dir = -1; dir <= 1; dir += 2) {
        const yCss = imp.y + dir * travel;
        if (yCss < 0 || yCss > h) continue;
        const geom = etherGeom(yCss, h);
        for (let s = 0; s < 2; s++) {
          const side = s === 0 ? -1 : 1;
          const xCss = gx + side * (22 + geom.disp * 0.45);
          const shine = etherMirror(xCss, yCss, side * geom.slope, {
            x: imp.cx, y: imp.cy, z: 40, w: 2.2 * fade,
          });
          const amount = Math.min(7.5, (1.15 + shine) * fade * 3.6);
          paintEtherSpecular(out, bw, bh, xCss * sx - x0, yCss * sy, imp.rgb, amount);
        }
      }
    }
    g.putImageData(new ImageData(out, bw, bh), x0, 0);
  }

  function traceEtherEdge(g, gx, h, side) {
    const steps = 64;
    g.beginPath();
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * h;
      const geom = etherGeom(y, h);
      const x = gx + side * (22 + geom.disp * 0.45);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
  }

  function drawGlassGate(g, gx, h, t, ether) {
    if (!ether) {
      drawSharedGateLine(g, gx, h);
      return;
    }
    drawEtherField(g, gx, h);
    g.save();
    g.beginPath();
    traceEtherEdge(g, gx, h, -1);
    const steps = 64;
    for (let i = steps; i >= 0; i--) {
      const y = (i / steps) * h;
      const geom = etherGeom(y, h);
      g.lineTo(gx + (22 + geom.disp * 0.45), y);
    }
    g.closePath();
    const body = g.createLinearGradient(gx - 40, 0, gx + 40, 0);
    body.addColorStop(0, "rgba(160,200,235,0)");
    body.addColorStop(0.18, "rgba(186,214,240,0.1)");
    body.addColorStop(0.5, "rgba(220,236,255,0.16)");
    body.addColorStop(0.82, "rgba(186,214,240,0.1)");
    body.addColorStop(1, "rgba(160,200,235,0)");
    g.fillStyle = body;
    g.fill();
    g.lineWidth = 1.25;
    g.strokeStyle = "rgba(214,232,250,0.72)";
    traceEtherEdge(g, gx, h, -1);
    g.stroke();
    traceEtherEdge(g, gx, h, 1);
    g.stroke();
    g.restore();
    drawSharedGateLine(g, gx, h);
  }

  function spawnGateRipple(x, y) {
    gateRipples.push({ x, y, life: 1.05, max: 1.05 });
    if (gateRipples.length > 14) gateRipples.splice(0, gateRipples.length - 14);
  }

  function drawGateRipples(g, ether) {
    g.save();
    g.globalCompositeOperation = "lighter";
    g.lineJoin = "round";
    for (let i = 0; i < gateRipples.length; i++) {
      const o = gateRipples[i];
      const u = 1 - o.life / o.max;
      const rad = (18 + u * (ether ? 240 : 150));
      const a = (1 - u) * (ether ? 0.62 : 0.38);
      const wob = ether ? 0.14 : 0.05;
      const N = 40;
      for (let ring = 0; ring < 2; ring++) {
        const rr = rad * (ring === 0 ? 1 : 0.62);
        const aa = a * (ring === 0 ? 1 : 0.55);
        g.beginPath();
        for (let k = 0; k <= N; k++) {
          const ang = (k / N) * Math.PI * 2;
          const w = 1 + Math.sin(ang * 5 + u * 8 + i + ring) * wob
            + Math.sin(ang * 3 - u * 6 + ring) * wob * 0.55;
          const px = o.x + Math.cos(ang) * rr * 0.78 * w;
          const py = o.y + Math.sin(ang) * rr * w;
          if (k === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.closePath();
        g.strokeStyle = ring === 0 ? "rgba(198,232,255," + aa + ")" : "rgba(255,214,244," + (aa * 0.7) + ")";
        g.lineWidth = (ether ? 2.6 : 1.5) * (1 - u) + 0.45;
        g.stroke();
      }
    }
    g.restore();
  }

  function drawGateBugs(g, w, h) {
    const now = performance.now() / 1000;
    g.save();
    g.globalCompositeOperation = "lighter";
    g.lineCap = "round";
    for (let i = 0; i < gateBugs.length; i++) {
      const b = gateBugs[i];
      const x = b.u * w;
      const y = b.v * h;
      const blink = Math.pow(Math.max(0, Math.sin(now * b.hz * Math.PI * 2 + b.ph)), 3);
      const a = 0.42 + blink * 0.58;
      const ang = Math.atan2(b.vy, b.vx);
      const streak = 9 + blink * 10;
      g.strokeStyle = gateRgba(b.rgb, a * 0.55);
      g.lineWidth = b.r * 1.15;
      g.beginPath();
      g.moveTo(x - Math.cos(ang) * streak, y - Math.sin(ang) * streak);
      g.lineTo(x, y);
      g.stroke();
      const glowR = b.r * (6.5 + blink * 3);
      const glow = g.createRadialGradient(x, y, 0, x, y, glowR);
      glow.addColorStop(0, gateRgba(b.rgb, 0.55 + blink * 0.4));
      glow.addColorStop(0.35, gateRgba(b.rgb, 0.16 + blink * 0.2));
      glow.addColorStop(1, gateRgba(b.rgb, 0));
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y, glowR, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = gateRgba(b.rgb, a);
      g.beginPath();
      g.arc(x, y, b.r * (0.85 + blink * 0.45), 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255," + (0.45 + blink * 0.5) + ")";
      g.beginPath();
      g.arc(x, y, b.r * 0.42, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }



  function drawNeonCube(g, w, h, t) {
    // Revolves around the shared gate line, so that line is one cube edge.
    const gx = w * 0.5;
    const cy = h * 0.5;
    const size = Math.min(w, h) * 0.2;
    const yaw = t * 0.7;
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const A = 1.15;
    const raw = [
      [0, -1, 0], [A, -1, 0], [A, 1, 0], [0, 1, 0],
      [0, -1, A], [A, -1, A], [A, 1, A], [0, 1, A],
    ];
    const v = raw.map((p) => {
      const x1 = p[0] * c + p[2] * s;
      const z1 = -p[0] * s + p[2] * c;
      const persp = 2.7 / (2.7 + z1);
      return { x: gx + x1 * size * persp, y: cy + p[1] * size * persp, z: z1 };
    });
    const faces = [
      { id: [0, 1, 2, 3], rgb: [70, 190, 255] },
      { id: [4, 5, 6, 7], rgb: [255, 80, 170] },
      { id: [0, 1, 5, 4], rgb: [70, 255, 190] },
      { id: [3, 2, 6, 7], rgb: [255, 170, 60] },
      { id: [1, 2, 6, 5], rgb: [255, 70, 110] },
      { id: [0, 3, 7, 4], rgb: [160, 110, 255] },
    ];
    faces.sort((a, b) => {
      const za = a.id.reduce((s, i) => s + v[i].z, 0);
      const zb = b.id.reduce((s, i) => s + v[i].z, 0);
      return za - zb;
    });
    g.save();
    for (let f = 0; f < faces.length; f++) {
      const face = faces[f];
      g.beginPath();
      face.id.forEach((i, k) => {
        if (k === 0) g.moveTo(v[i].x, v[i].y);
        else g.lineTo(v[i].x, v[i].y);
      });
      g.closePath();
      g.fillStyle = "rgba(" + face.rgb[0] + "," + face.rgb[1] + "," + face.rgb[2] + ",0.13)";
      g.fill();
    }
    const edges = [[0, 3], [0, 1], [1, 2], [2, 3], [4, 7], [4, 5], [5, 6], [6, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    g.lineCap = "round";
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < edges.length; i++) {
      const a = v[edges[i][0]];
      const b = v[edges[i][1]];
      g.strokeStyle = "rgba(190,220,255,0.35)";
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }
    // Staircase of light walking the edges. Edge 0 is the gate line.
    const steps = 4;
    const travel = (t * 1.35) % edges.length;
    for (let k = 0; k < steps; k++) {
      const pos = (travel - k + edges.length * 4) % edges.length;
      const ei = Math.floor(pos);
      const f = pos - ei;
      const a = v[edges[ei][0]];
      const b = v[edges[ei][1]];
      const x = a.x + (b.x - a.x) * f;
      const y = a.y + (b.y - a.y) * f;
      const hue = faces[ei % faces.length].rgb;
      const alpha = 0.95 - k * 0.2;
      g.strokeStyle = "rgba(" + hue[0] + "," + hue[1] + "," + hue[2] + "," + alpha + ")";
      g.lineWidth = 2.4 - k * 0.35;
      g.beginPath();
      g.moveTo(a.x + (b.x - a.x) * Math.max(0, f - 0.22), a.y + (b.y - a.y) * Math.max(0, f - 0.22));
      g.lineTo(x, y);
      g.stroke();
      if (k === 0) {
        g.fillStyle = "rgba(255,255,255,0.95)";
        g.beginPath();
        g.arc(x, y, 2.2, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  function drawGate(g, w, h, t, sampleOnly) {
    // Gate: one fixed path per voice (shared pathId = one slot, separate phases).
    // Audio crossing handoff (stable names), written every frame:
    //   v._orbPhase  progress along the path in [0,1)  (includes v.phase)
    //   v._gatePhase primary path parameter where the path meets the gate, in [0,1)
    //                (two crossings → the smaller phase)
    //   v._orbX, v._orbY  current orb canvas position
    //   v._gateSide  Math.sign(orbX - gateX); 0 on the line so Audio can see zero-crossings
    const nowMs = performance.now();
    const dt = gateFxStamp ? Math.min(0.05, (nowMs - gateFxStamp) / 1000) : 0.016;
    gateFxStamp = nowMs;
    tickGateFx(dt);
    tickGateAtmosphere(dt);

    const pathKeys = [];
    state.voices.forEach((v) => {
      const key = v.pathId || ("v" + v.id);
      if (!pathKeys.includes(key)) pathKeys.push(key);
    });
    const n = Math.max(1, pathKeys.length);
    const gx = w * 0.5;
    const top = h * 0.08;
    const bottom = h * 0.92;
    const band = (bottom - top) / n;
    g.globalCompositeOperation = "source-over";

    const pts = [];
    const slots = [];
    const slotByKey = {};
    state.voices.forEach((v) => {
      const key = v.pathId || ("v" + v.id);
      const pi = Math.max(0, pathKeys.indexOf(key));
      const cy = top + band * (pi + 0.5);
      // pathKind from the prefix. cube uses the square edge loop. Fallback keeps older presets.
      const named = v.pathKind === "circle" ? 0
        : v.pathKind === "line" ? 1
        : (v.pathKind === "square" || v.pathKind === "cube") ? 2
        : -1;
      const kind = named < 0 ? (pi % 3) : named;
      const half = Math.min(band * 0.36, w * 0.22, h * 0.28);
      const period = Math.max(0.12, voicePeriodSec(v));
      const orbPhase = (((t / period) + (v.phase || 0)) % 1 + 1) % 1;
      let gatePhase, x, y;

      if (kind === 0) {
        // Circle centered on the gate. Crossings: top phase 0, bottom 0.5.
        const r = Math.max(10, half);
        gatePhase = 0;
        const ang = orbPhase * Math.PI * 2 - Math.PI / 2;
        x = gx + Math.cos(ang) * r;
        y = cy + Math.sin(ang) * r;
        if (!slotByKey[key]) slotByKey[key] = { color: v.color, stroke: "circle", gx, cy, r };
      } else if (kind === 1) {
        // Segment; orb ping-pongs. Gate crossings at phase 0.25 and 0.75.
        const x0 = gx - half * 1.45;
        const x1 = gx + half * 1.45;
        gatePhase = 0.25;
        const ping = orbPhase < 0.5 ? orbPhase * 2 : 2 - orbPhase * 2;
        x = x0 + (x1 - x0) * ping;
        y = cy;
        if (!slotByKey[key]) slotByKey[key] = { color: v.color, stroke: "line", x0, x1, cy };
      } else {
        // Square = projected cube-edge loop, clockwise from top-left.
        // Gate cuts the top edge at 0.125 and the bottom edge at 0.625.
        const s = Math.max(8, half * 0.92);
        const xL = gx - s, xR = gx + s, yT = cy - s, yB = cy + s;
        gatePhase = 0.125;
        const edge = orbPhase * 4;
        const e = Math.floor(edge) % 4;
        const f = edge - Math.floor(edge);
        if (e === 0) { x = xL + (xR - xL) * f; y = yT; }
        else if (e === 1) { x = xR; y = yT + (yB - yT) * f; }
        else if (e === 2) { x = xR + (xL - xR) * f; y = yB; }
        else { x = xL; y = yB + (yT - yB) * f; }
        if (!slotByKey[key]) slotByKey[key] = { color: v.color, stroke: "square", xL, xR, yT, yB };
      }
      if (slotByKey[key] && !slotByKey[key]._listed) {
        slotByKey[key]._listed = true;
        slots.push(slotByKey[key]);
      }

      v._orbPhase = orbPhase;
      v._gatePhase = gatePhase;
      v._orbX = x;
      v._orbY = y;
      v._gateSide = Math.sign(x - gx);
      // Bloom stays on the gate. The orb has already stepped past the line.
      if (onGateSideSample(v, v._gateSide)) {
        v._flashX = gx;
        v._flashY = y;
        spawnGateHit(v, gx, y);
        spawnGateRipple(gx, y);
        spawnEtherImpulse(v, gx, y, x);
      }
      pts.push({ v, x, y });
    });

    const live = {};
    for (let i = 0; i < pts.length; i++) live[pts[i].v.id] = 1;
    Object.keys(gateOrbTrails).forEach((id) => { if (!live[id]) delete gateOrbTrails[id]; });

    recordGateWakes(pts);
    if (sampleOnly) return;
    if (gateLookOn("clouds") || gateLookOn("wake")) drawGateClouds(g, w, h, t);
    if (gateLookOn("glass")) drawGateGlass(g, w, h, t);
    if (gateLookOn("reflect")) drawGateReflections(g, w, h, pts);

    drawGateFx(g);

    g.globalCompositeOperation = "source-over";
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      g.strokeStyle = hexAlpha(s.color, 0.32);
      g.lineWidth = 1.35;
      g.beginPath();
      if (s.stroke === "circle") g.arc(s.gx, s.cy, s.r, 0, Math.PI * 2);
      else if (s.stroke === "line") { g.moveTo(s.x0, s.cy); g.lineTo(s.x1, s.cy); }
      else {
        g.moveTo(s.xL, s.yT);
        g.lineTo(s.xR, s.yT);
        g.lineTo(s.xR, s.yB);
        g.lineTo(s.xL, s.yB);
        g.closePath();
      }
      g.stroke();
    }

    // Shared gate stays at x = w/2. gateGlass selects liquid ether; off is the plain line.
    const gateBoost = gateLookOn("gateGlass");
    drawGlassGate(g, gx, h, t, gateBoost);
    drawGateRipples(g, gateBoost);
    if (gateLookOn("cube")) drawNeonCube(g, w, h, t);

    if (gateLookOn("bugs")) drawGateBugs(g, w, h);
    for (let i = 0; i < pts.length; i++) drawLivingOrb(g, pts[i].v, pts[i].x, pts[i].y, t);
    g.globalCompositeOperation = "source-over";
  }

  function hexAlpha(hex, a) {
    const h = toHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ---------- Transport ----------
  function setControlsHidden(hidden) {
    state.controlsHidden = !!hidden;
    document.body.classList.toggle("controls-hidden", state.controlsHidden);
    const btn = $("#toggleControls");
    if (btn) {
      btn.textContent = state.controlsHidden ? "Edit" : "Hide";
      btn.classList.toggle("active", !state.controlsHidden);
      btn.setAttribute("aria-pressed", String(!state.controlsHidden));
    }
  }

  function toggleControls() {
    setControlsHidden(!state.controlsHidden);
    if (!state.controlsHidden && autoHideTimer) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }
  }

  function scheduleAutoHide(ms = 2800) {
    if (autoHideTimer) clearTimeout(autoHideTimer);
    autoHideTimer = setTimeout(() => {
      if (state.playing) setControlsHidden(true);
      autoHideTimer = null;
    }, ms);
  }

  async function togglePlay() {

    initAudio();
    if (ctx.state === "suspended") await ctx.resume();
    if (!state.playing) {
      transportStart = ctx.currentTime;
      visualOrigin = performance.now();
      resetVoiceSchedulers();
      state.playing = true;
      startScheduler();
    } else {
      pauseAccum = transportTime();
      state.playing = false;
      stopScheduler();
