/** Polyrhythm Studio loader — plain JS parts (verified) */
(async () => {
  try {
    const n = 2;
    const parts = await Promise.all([...Array(n).keys()].map(i =>
      fetch("app.part" + i + ".js").then(r => {
        if (!r.ok) throw new Error("part" + i + " HTTP " + r.status);
        return r.text();
      })
    ));
    const code = parts.join("");
    if (code.indexOf("Session Ready") < 0) throw new Error("loaded script incomplete");
    const s = document.createElement("script");
    s.textContent = code;
    document.documentElement.appendChild(s);
  } catch (e) {
    const pre = document.createElement("pre");
    pre.style.cssText = "color:#f88;padding:1rem;position:fixed;inset:0;background:#100;z-index:99999;white-space:pre-wrap";
    pre.textContent = "Polyrhythm Studio failed to load:\n" + e;
    document.body.appendChild(pre);
  }
})();
