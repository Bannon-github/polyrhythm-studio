# Polyrhythm Studio

A generative ambient polyrhythm app that runs in the browser. Each voice is an orb on a fixed path. A shared line crosses those paths. The tone plays only when an orb crosses that line.

**Live:** [https://bannon-github.github.io/polyrhythm-studio/](https://bannon-github.github.io/polyrhythm-studio/)

Original work. No copyrighted samples, videos, or cloned assets. Not affiliated with any pendulum-wave or ambient channel.

## Play

Open the live page, or serve this folder (`npx serve .` or `python3 -m http.server 8080`) and open the printed URL. A local file URL will not load the scripts.

Press **Play** (or Space while the page is focused). Browsers will not start sound until that gesture.

Hard-refresh after a deploy. The loader fetches `app.part0.js` through `app.part15.js` with a cache-busting query.

## How it works

Gate is the default view on a fresh load.

- Each voice has a geometric path: a circle, a line, a square, or a cube-style edge loop. One orb usually travels that path.
- One shared vertical line sits at the center. A voice sounds only when its orb crosses that line. The line is a glass slab, and a ring spreads outward on the crossing.
- Orbs are living marks, not static dots. Low notes read darker and heavier. High notes read brighter.
- Other views stay in the mode menu: Pendulum, Circular, Linear, Mandala, Triangles, Waves, and Sine ribbons.

### Looks

On Gate, a **Looks** row sits under the stage. Every look starts off and can be combined.

- **Glass**, **Reflect**, **Clouds**, **Firebugs**, and **Wake** are separate layers.
- **Ether** is a liquid sheet on the gate. Light on it comes from the orbs and the line. A crossing sends a shimmer outward.
- **Cube** is a slowly turning neon box around the gate edge. Faces use different hues, and light steps along the edges.

### Dials

Five dials sit on the page. Each has a colored backlight that follows the value it owns.

- **Speed** is tempo.
- **Volume** is the master level.
- **Feel** is simplicity.
- **Path** is the first voice's shape: Auto, Circle, Line, Square, or Cube.
- **Space** is reverb.

A **heat** flag next to the preset menu reads `clean` at a normal level. If the output gets hot, the master eases down and the flag reads `hot`.

## Prefixes

The preset menu includes six Gate machines. Each sets path count, shape, speed, and the note for that path.

- **Harmonic Ladder** — four lines, speeds 1:2:3:4, notes C2 C3 G3 C4.
- **Soft Fifth** — two circles, speeds 2 and 3, notes G3 and D4.
- **Just Third** — two squares, speeds 4 and 5, notes C4 and E4.
- **Orbital** — three circles, speeds 4:5:6, notes C3 E3 G3.
- **Pendulum Chord** — five lines, speeds 5 through 9, notes C3 D3 E3 G3 A3.
- **Twin Fifth** — a G3 line at speed 2, plus two orbs on a D4 line at speed 3.

Pitches are named notes. A later pass can lock those stacks to exact integer ratios from one root. Older presets (Session Ready, pendulum waves, mandala, and the rest) are still in the same menu.

## Audio

Crossings for sine, triangle, bell, and pad play original samples in `samples/gate/`. Those files are mono WAV, 48 kHz, 24-bit: C2, C3, D3, E3, G3, A3, C4, D4, and E4. The nearest note is chosen, then playback rate matches the voice. Noise, kick, saw, and square stay synthesized. If a file fails to load, the oscillator is the fallback.

The master chain is gain, a soft saturator, a limiter, then the speakers.

## Files

- `index.html` and `styles.css` are the page.
- `app.js` loads `app.part0.js` through `app.part15.js` and runs them as one script.
- `samples/gate/` holds the crossing samples and `manifest.json`.
- `app.payload.*.b64` is an older compressed bundle. The live page does not fetch it.

Save and Load use the browser's local storage. Clearing that storage returns a fresh Gate load.

## Pages

GitHub Pages deploys from the `main` branch, root folder. The site is [https://bannon-github.github.io/polyrhythm-studio/](https://bannon-github.github.io/polyrhythm-studio/).

```
git clone https://github.com/Bannon-github/polyrhythm-studio.git
cd polyrhythm-studio
npx serve .
```

## License

Use it freely for personal and educational projects. Attribution is appreciated, not required.
