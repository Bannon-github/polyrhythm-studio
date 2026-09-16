# Polyrhythm Studio

A **generative ambient polyrhythm** browser app: multiple rhythmic voices drift in and out of sync (pendulum-wave style), with Canvas visuals and Web Audio tones.

**Channel functional model:** inspired by the Lucid Rhythms family of ambient polyrhythm / pendulum / wave visuals (e.g. *Hammer Waves*, *Space Pendulum*, *Sine Rhythms*, *Black Hole Reimagined*, *Space Lullaby*). **Not affiliated** with those creators or channels; this is an original open project with no copyrighted samples, videos, or cloned proprietary assets.

## Open the app

Serve the folder over **http** (the runtime loads compressed payloads via `fetch`):

- **Local:** `npx serve .` or `python3 -m http.server 8080` then open the printed URL.
- **Clone:** `git clone https://github.com/Bannon-github/polyrhythm-studio.git && cd polyrhythm-studio && npx serve .`
- **GitHub Pages:** enable Pages (Deploy from branch → `/` on `main`) → `https://bannon-github.github.io/polyrhythm-studio/`
- **Raw files:** browsing raw GitHub is fine for reading sources; run the app via Pages or a local static server (not `file://`).

Click **Play** (or Space with page focus) to start audio + motion. Browsers require a user gesture before sound.

Runtime files: `index.html`, `styles.css`, `app.js` (tiny loader), `app.payload.0-2.b64` (zlib-compressed studio source).

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
