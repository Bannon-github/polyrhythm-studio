# Polyrhythm Studio

A **generative ambient polyrhythm** browser app: multiple rhythmic voices drift in and out of sync (pendulum-wave style), with Canvas visuals and Web Audio tones.

**Live:** [https://bannon-github.github.io/polyrhythm-studio/](https://bannon-github.github.io/polyrhythm-studio/)

**Channel functional model:** inspired by the Lucid Rhythms family of ambient polyrhythm / pendulum / wave visuals (e.g. *Hammer Waves*, *Space Pendulum*, *Sine Rhythms*, *Black Hole Reimagined*, *Space Lullaby*). **Not affiliated** with those creators or channels; this is an original open project with no copyrighted samples, videos, or cloned proprietary assets.

## Open the app

- **GitHub Pages (recommended):** [https://bannon-github.github.io/polyrhythm-studio/](https://bannon-github.github.io/polyrhythm-studio/)
- **Local:** `npx serve .` or `python3 -m http.server 8080` then open the printed URL (needed because the runtime `fetch`es compressed payloads).
- **Clone:** `git clone https://github.com/Bannon-github/polyrhythm-studio.git && cd polyrhythm-studio && npx serve .`

Click **Play** (or Space with page focus) to start audio + motion. Browsers require a user gesture before sound.

Runtime files: `index.html`, `styles.css`, `app.js` (tiny loader), `app.payload.0–3.b64` (zlib-compressed studio source with **Session Ready** default). `.nojekyll` keeps GitHub Pages from running Jekyll on the static site.

### Enabling / configuring Pages

Pages cannot be fully enabled via the public API without admin rights on the repo. In GitHub UI:

1. **Settings → Pages**
2. Prefer **GitHub Actions** (uses `.github/workflows/deploy-pages.yml` on push to `main`), **or** **Deploy from a branch** → `main` / root (`/`). Both work with `.nojekyll`.
3. After the first successful deploy, the site is at `https://bannon-github.github.io/polyrhythm-studio/`.

### Custom domain

Point a CNAME (or ALIAS/ANAME at the apex) to **`bannon-github.github.io`**, then add the hostname under **Settings → Pages → Custom domain**. Optionally commit a `CNAME` file at the repo root containing that hostname. Enforce HTTPS after DNS propagates.

## Features

### Visual modes
- **Pendulum** — side-by-side pendulums with different periods. Optional **Quadratic length** (`L ∝ T²`).
- **Circular** — concentric rings with orbiting beads (pulse orbits).
- **Linear** — beat markers and a playhead.
- **Mandala** — concentric petals/arcs rotating at each voice period.
- **Triangles** — spinning N-gons (N=3+) whose rotation rate follows the voice period.
- **Waves** — stacked horizontal sine/hammer wave bars (*Hammer Waves* feel).
- **Sine ribbons** — stacked full-width sine curves (*Sine Rhythms* feel).

### Quadratic Displacement (pendulum)
When **Quadratic length** is on, pendulum string length scales with period squared (`L ∝ T²`), matching physical pendulums / classic “pendulum wave” demos: slower voices hang longer, faster ones shorter, so phases bloom and re-align visually.

### Voices (up to 12)
Beats-in-cycle or period (seconds), pitch (note or Hz), waveform (`sine` / `triangle` / `saw` / `square` / `noise` / `bell` / `kick` / `pad`), volume, mute, color, pan, and **simplicity** (master + per-voice).

### Presets
- **`Session Ready`** — default on first load (clean ambient start)
- `3:2 classic`, `5:4`
- `Space Pendulum`, `Hammer Waves`, `Deep Ambient / Black Hole`, `Space Lullaby`
- `Sine Rhythms` — sineRibbons mode
- `Mandala` — mandala mode
- `Spinning Triangles` — triangles mode
- `Pulse Orbits` — circular + orbit-y phased voices
- `Lost In Space` — very sparse, high simplicity, quadratic pendulum

**Save / Load** uses `localStorage`. Polyrhythm helper sets A:B on the first two voices. **Evolve** drifts pitches/periods.

## Audio
Web Audio lookahead scheduling, dry + generated-impulse reverb + feedback delay. All tones synthesized — no sample packs from videos.

## Credit
Aesthetic and **channel functional model** inspiration from publicly shared ambient polyrhythm pendulum / wave videos (Lucid Rhythms–style). Independent, original, **not affiliated**.

## License
Use freely for personal and educational projects. Attribution appreciated but not required.
