/** Polyrhythm Studio — loads readable parts (serve over http; GitHub Pages works) */
(async () => {
  try {
    const parts = await Promise.all(
      ["app.part0.js", "app.part1.js", "app.part2.js"].map((p) => fetch(p).then((r) => {
        if (!r.ok) throw new Error(p + " " + r.status);
        return r.text();
      }))
    );
    const s = document.createElement("script");
    s.textContent = parts.join("");
    document.documentElement.appendChild(s);
  } catch (e) {
    document.body.innerHTML =
      '<pre style="color:#f88;padding:2rem;font:14px monospace">Could not load app parts (' + e + ').\n' +
      'Open via GitHub Pages or a local static server (e.g. npx serve), not as a raw file:// URL.\n' +
      'Readable sources: app.part0.js, app.part1.js, app.part2.js</pre>';
  }
})();
