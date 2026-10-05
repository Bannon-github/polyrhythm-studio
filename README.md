# Polyrhythm Studio

A generative ambient polyrhythm app that runs in the browser. A tone plays only when a traveler meets the line for that machine. Each machine is its own layout, with its own panel and its own sounds. They are not layers stacked on one scene.

**Live:** [https://bannon-github.github.io/polyrhythm-studio/](https://bannon-github.github.io/polyrhythm-studio/)

Original work. No copyrighted samples or cloned assets.

## Play

Open the live page, or serve this folder (`npx serve .` or `python3 -m http.server 8080`). A local file URL will not load the scripts.

Press **Play** (or Space while the page is focused). Hard-refresh after a deploy. The loader fetches `app.part0.js` through `app.part15.js`.

Pick a machine from the mode menu. The panel changes with the machine. Turning a dial does not replay every note.

## Circular Rhythm

Concentric rings. The inner ring is the highest pitch. The outer rings are lower. Orbs start lined up and share one speed, so an outer ring takes longer to reach the hit and the pattern drifts.

Hits are sparkle and reflection behind the rings, not a line drawn across the page. A liquid reflection sits on the other side of the scene. Zoom pulls back for more rings.

One panel: **Rings**, **Chord** (C, Am, Em, G5, D5, C5), **Tempo**, **Line**, **Zoom**. Line off keeps the orbs moving and stops the hits.

Crossings play the mallet samples in `samples/gate/` (mono WAV, 48 kHz, 24-bit).

## Cube

Its own machine. Nested cubes, smoked faces, copper edges, rising embers, and a dark slab behind. It does not use the ring look.

On each face a traveler moves from the outer edge to the center and back, as a wave of square steps. The hit is that outer edge. Contact throws an ember burst and a reflection on the slab. There is no line across the page.

The panel is nest depth only. Face hits play the dry wood-blocks in `samples/cubes/`, not the ring mallets.

## Lucid Rhythms

Its own machine. Ten crystal shafts in a row, low pitch left to high right (C2…C5). Glass cubes bounce with gravity inside the shafts and sound only on the bottom sill. Tops stay silent. Hits light the whole structure and play a live harp; a sparse bass alternates C2 and G2.

Cubes stick on the sill through the hit flash, then rebound. One Lucid panel. No Gate Looks row.

## Nested Triangles

Its own machine. Concentric nested triangles with independent travelers on tri-0…tri-6. Hits flash only on the outer edge. Voices overlap as a polysynth chord (Am chime), not a mono choke.

Sequential pulse moves in to out. One panel. Lucid, Circular, and Cube stay separate machines.

## Gate

Still in the menu. Orbs travel geometric paths and sound when they cross the shared center line. Older pendulum, mandala, wave, and ribbon views are in the same menu.

Gate dials, when that machine is showing: Speed, Volume, Feel, Path, and Space. A heat flag near the preset menu reads clean, and eases the level if the output gets hot.

## Files

- `index.html` and `styles.css` are the page.
- `app.js` loads the `app.part*.js` files and runs them as one script.
- `samples/gate/` is the Circular and Gate mallet bank. `samples/cubes/` is the Cube bank.
- `app.payload.*.b64` is an older bundle. The live page does not fetch it.

Save and Load use the browser's local storage.

## Pages

GitHub Pages deploys from `main`, root folder.

```
git clone https://github.com/Bannon-github/polyrhythm-studio.git
cd polyrhythm-studio
npx serve .
```

## License

Use it freely for personal and educational projects. Attribution is appreciated, not required.
