    $("#playBtn").textContent = state.playing ? "Pause" : "Play";
    $("#playBtn").classList.toggle("playing", state.playing);
    document.body.classList.toggle("playing", state.playing);
    document.body.classList.toggle("controls-hidden", state.controlsHidden);
    const tbtn = $("#toggleControls");
    if (tbtn) {
      tbtn.textContent = state.controlsHidden ? "Edit" : "Hide";
      tbtn.classList.toggle("active", !state.controlsHidden);
    }
  }

  function simplicityLabel(n) {
    if (n < 28) return `${n} Complex`;
    if (n < 55) return `${n} Medium`;
    if (n < 78) return `${n} Simple`;
    return `${n} Sparse`;
  }

  function renderVoiceList() {
    const list = $("#voicesList");
    list.innerHTML = "";
    state.voices.forEach((v, idx) => {
      const card = document.createElement("div");
      card.className = "voice-card" + (v.mute ? " muted" : "");
      card.innerHTML = `
        <div class="voice-swatch" style="background:${v.color}"></div>
        <div class="voice-body">
          <div class="voice-top">
            <span class="name">${escapeHtml(v.name)}</span>
            <label class="chk"><input type="checkbox" data-k="mute" ${v.mute ? "checked" : ""}/> Mute</label>
            <button type="button" class="ghost" data-act="dup" title="Duplicate">Dup</button>
            <button type="button" class="danger ghost" data-act="rm" title="Remove">✕</button>
          </div>
          <div class="voice-controls">
            <label class="field">Beats in cycle
              <input type="number" min="1" max="24" step="1" data-k="beatsInCycle" value="${v.beatsInCycle}"/>
            </label>
            <label class="field">Period (s) <span class="chk" style="display:inline;text-transform:none"><input type="checkbox" data-k="usePeriod" ${v.usePeriod ? "checked" : ""}/> use</span>
              <input type="number" min="0.15" max="20" step="0.05" data-k="periodSec" value="${v.periodSec}"/>
            </label>
            <label class="field">Pitch mode
              <select data-k="pitchMode">
                <option value="note" ${v.pitchMode === "note" ? "selected" : ""}>Note</option>
                <option value="hz" ${v.pitchMode === "hz" ? "selected" : ""}>Hz</option>
              </select>
            </label>
            <label class="field">Note
              <select data-k="note">${NOTES.map((n) => `<option value="${n}" ${n === v.note ? "selected" : ""}>${n}</option>`).join("")}</select>
            </label>
            <label class="field">Hz
              <input type="number" min="20" max="4000" step="0.1" data-k="hz" value="${v.hz}"/>
            </label>
            <label class="field">Waveform
              <select data-k="waveform">${WAVEFORMS.map((w) => `<option value="${w}" ${w === v.waveform ? "selected" : ""}>${w}</option>`).join("")}</select>
            </label>
            <label class="field">Volume <span class="val">${v.volume.toFixed(2)}</span>
              <input type="range" min="0" max="1" step="0.01" data-k="volume" value="${v.volume}"/>
            </label>
            <label class="field">Pan <span class="val">${v.pan.toFixed(2)}</span>
              <input type="range" min="-1" max="1" step="0.01" data-k="pan" value="${v.pan}"/>
            </label>
            <label class="field">Color
              <input type="color" data-k="color" value="${toHex(v.color)}" style="width:100%;height:28px;border:none;background:transparent;cursor:pointer"/>
            </label>
            <label class="field span-sim">Simplicity <span class="val">${simplicityLabel(v.simplicity)}</span>
              <input type="range" min="0" max="100" step="1" data-k="simplicity" value="${v.simplicity}"/>
            </label>
          </div>
          <p class="hint">Higher simplicity → fewer hits, calmer ambient spacing (sparse lullaby). Lower → denser polyrhythm.</p>
        </div>`;
      card.querySelectorAll("[data-k]").forEach((el) => {
