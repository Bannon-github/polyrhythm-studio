# Polyrhythm Studio

A **generative ambient polyrhythm** browser app: multiple rhythmic voices drift in and out of sync (pendulum-wave style), with Canvas visuals and Web Audio tones.

**Channel functional model:** inspired by the Lucid Rhythms family of ambient polyrhythm / pendulum / wave visuals (e.g. *Hammer Waves*, *Space Pendulum*, *Sine Rhythms*, *Black Hole Reimagined*, *Space Lullaby*). **Not affiliated** with those creators or channels; this is an original open project with no copyrighted samples, videos, or cloned proprietary assets.

## Open the app

- **Local:** clone or download, then open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge).
- **Raw / preview:** open the raw GitHub files or use a static preview; for best results serve the folder (or use Pages).
- **Clone:** `git clone https://github.com/Bannon-github/polyrhythm-studio.git` then open `index.html`.
- **GitHub Pages:** enable Pages on this repo (Deploy from branch → `/` on `main`), then visit `https://bannon-github.github.io/polyrhythm-studio/`.
- No build step, no backend. Files: `index.html`, `styles.css`, `app.js`.

Click **Play** (or press Space when focus is on the page) to start audio + motion. Browsers require a user gesture before sound.

## Features

### Visual modes
- **Pendulum** — side-by-side pendulums with different periods (classic wave / phase drift). Optional **Quadratic length** (`L ∝ T²`).
- **Circular** — concentric rings with orbiting beads (pulse orbits).
- **Linear** — grid of beat markers and a playhead.
- **Mandala** — concentric petals/arcs rotating at each voice period.
- **Triangles** — spinning N-gons (N=3+) whose rotation rate follows the voice period.
- **Waves** — stacked horizontal sine/hammer wave bars (*Hammer Waves* feel).
- **Sine ribbons** — stacked full-width sine curves (*Sine Rhythms* feel).

### Quadratic Displacement (pendulum)
When **Quadratic length** is on, pendulum string length scales with period squared (`L ∝ T²`), the same relationship as physical pendulums / classic classroom “pendulum wave” demos: slower voices hang longer, faster ones shorter, so phases bloom and re-align visually.

### Voices (up to 12)
Each voice: beats-in-cycle or period (seconds), pitch (note or Hz), waveform (`sine` / `triangle` / `saw` / `square` / `noise` / `bell` / `kick` / `pad`), volume, mute, color, pan, and **simplicity**.

### Simplicity (first-class)
- **Master simplicity** (0–100) plus quick **Simple / Medium / Complex** presets.
- **Per-voice simplicity** slider on every voice card.
- Higher simplicity → fewer subdivisions fire, calmer spacing (lullaby / deep ambient).
- Lower simplicity → denser polyrhythm.

### Master
BPM or master cycle length, master volume, reverb / delay wet, Play/Pause, quadratic length toggle.

### Presets
- `3:2 classic`, `5:4`
- `Space Pendulum`, `Hammer Waves`, `Deep Ambient / Black Hole`, `Space Lullaby`
- `Sine Rhythms` — sineRibbons mode
- `Mandala` — mandala mode
- `Spinning Triangles` — triangles mode
- `Pulse Orbits` — circular + orbit-y phased voices
- `Lost In Space` — very sparse, high simplicity, quadratic pendulum

**Save / Load** stores the current setup in `localStorage`.

### Polyrhythm helper
Enter ratio **A:B** → configures the first two voices’ beat counts and simplicity.

### Evolve
Optional ambient drift: slowly modulates pitches / periods for generative texture.

## Audio engine
Sample-accurate-ish scheduling with `AudioContext.currentTime` lookahead. Dry + algorithmic reverb (generated impulse) + feedback delay. All tones synthesized — no sample packs from videos.

## Controls summary

| Control | What it does |
|--------|----------------|
| Play / Pause | Start or stop transport + audio |
| Visual mode menu | Pendulum / Circular / Linear / Mandala / Triangles / Waves / Sine ribbons |
| Preset menu | Load a starting scene |
| Quadratic length | Pendulum `L ∝ T²` |
| BPM / Master cycle | Global timing |
| Master + per-voice Simplicity | Sparse↔busy |
| A:B Apply | Set two-voice ratio |
| Evolve | Generative pitch/period drift |
| Save / Load | Persist setup locally |

## Credit / inspiration
Aesthetic and **channel functional model** inspiration from publicly shared ambient polyrhythm pendulum / wave videos (Lucid Rhythms–style). This repository is independent, original, and **not affiliated**.

## License
Use freely for personal and educational projects. Attribution appreciated but not required.
