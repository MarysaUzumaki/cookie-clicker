/* Звуки на WebAudio без аудиофайлов: клик, покупка, золотое печенье, ачивка. */
(function () {
  "use strict";

  let ctx = null;
  let muted = false;
  let volume = 0.4;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type, when, gain) {
    const c = ensureCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + (when || 0));
    g.gain.exponentialRampToValueAtTime((gain || 0.3) * volume, c.currentTime + (when || 0) + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (when || 0) + duration);
    osc.connect(g).connect(c.destination);
    osc.start(c.currentTime + (when || 0));
    osc.stop(c.currentTime + (when || 0) + duration + 0.02);
  }

  const plays = {
    click: function () { tone(620, 0.06, "triangle", 0, 0.18); },
    buy: function () { tone(440, 0.12, "square", 0, 0.14); tone(660, 0.14, "square", 0.06, 0.12); },
    error: function () { tone(160, 0.18, "sawtooth", 0, 0.16); },
    golden: function () { tone(880, 0.12, "sine", 0, 0.22); tone(1320, 0.2, "sine", 0.09, 0.2); },
    achievement: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, "triangle", i * 0.09, 0.2); }); },
    prestige: function () { [392, 494, 587, 784, 988, 1175].forEach(function (f, i) { tone(f, 0.3, "sine", i * 0.11, 0.22); }); },
  };

  function play(name) {
    if (muted) return;
    const fn = plays[name];
    if (fn) fn();
  }

  /* Громкость 0..1, muted переключается из настроек. */
  function setVolume(v) { volume = window.U.clamp(v, 0, 1); }
  function setMuted(m) { muted = !!m; }

  window.Sound = { play, setVolume, setMuted };
})();