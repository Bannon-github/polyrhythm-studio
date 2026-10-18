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
- **Pendulum** — every orb swings from one shared pivot at the top centre, each on its own string. A dashed line runs down the centre of the stage; an orb sounds its tone (in its own colour) at the instant it crosses that line, then swings out the other side. Slower voices hang on longer strings. Voices thinned out by **Simplicity** still cross the line, just silently. Optional **Quadratic length** (`L ∝ T²`).
- **Circular** — concentric rings with orbiting beads (pulse orbits).
- **Linear** — beat markers and a playhead.
- **Mandala** — concentric petals/arcs rotating at each voice period.
- **Triangles** — spinning N-gons (N=3+) whose rotation rate follows the voice period.
- **Waves** — stacked horizontal sine/hammer wave bars (*Hammer Waves* feel).
- **Sine ribbons** — stacked full-width sine curves (*Sine Rhythms* feel).

### The pendulum machine
Every orb hangs from one pivot at the top centre on its own string, and a taut string runs straight down the middle of the stage. The sound is made by the orbs crossing that string.

- **Real gravity.** Each orb is a dense sphere swinging under `g = 9.81 m/s²` with almost no air resistance (only a tiny pivot friction). The swing from the top to the bottom takes **5–10 s**, so strings are roughly **99–398 m** long. The HUD shows the scale (about 1.1 m per screen pixel).
- **Lift and release.** Hold **⬆ Hold to lift** (or Space/Enter on the button) to raise all the orbs; the longer you hold, the higher they go (up to 90°). Let go and they fall freely from that height. The badge shows how long they will keep ringing.
- **Every crossing rings.** Each pass through the centre sounds a long bell-like tone, and the orb glows with the tone's volume, brightening and fading with it. In this mode, tempo comes from the pendulum lengths rather than BPM, and Simplicity only thins the overall level.
- **Colour by pitch.** Glossy dark red for the lowest tone, through orange and yellow, to bright blue and violet for the highest.
- **Vibrating string.** The centre string blurs and shimmers in the colour of the orb that just crossed it.
- **Fog.** A slow fog always drifts across the stage. The light from each ringing orb is scattered and refracted through it, with colour fringes at the edges.
- **4K.** The drawing is rendered at up to 3840×2160 and scaled to fit.

The other visual modes keep the original beat-grid timing.

### Voices (up to 12)
Beats-in-cycle or period (seconds), pitch (note or Hz), waveform (`sine` / `triangle` / `saw` / `square` / `noise` / `bell` / `kick` / `pad`), volume, mute, color, pan, and **simplicity** (master + per-voice).

### Presets
- `3:2 classic`, `5:4`
- `Space Pendulum` — pendulum machine
- `Hammer Waves` — waves mode
- `Deep Ambient / Black Hole`, `Space Lullaby`
- `Sine Rhythms` — sineRibbons mode
- `Mandala` — mandala mode
- `Spinning Triangles` — triangles mode
- `Pulse Orbits` — circular + orbit-y phased voices
- `Lost In Space` — very sparse, high simplicity

**Save / Load** uses `localStorage`. Polyrhythm helper sets A:B on the first two voices. **Evolve** drifts pitches/periods.

## Audio
Web Audio lookahead scheduling, dry + generated-impulse reverb + feedback delay. All tones synthesized — no sample packs from videos.

## Credit
Aesthetic and **channel functional model** inspiration from publicly shared ambient polyrhythm pendulum / wave videos (Lucid Rhythms–style). Independent, original, **not affiliated**.

## License
Use freely for personal and educational projects. Attribution appreciated but not required.
