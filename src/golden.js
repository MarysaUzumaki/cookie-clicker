/* Золотые печенья: случайные появления, буст кликов ×7, «двойное» при быстром клике. */
(function () {
  "use strict";

  let store = null;
  let stageEl = null;
  let bannerEl = null;
  let lastGoldenAt = 0;

  const BOOST_MULTIPLIER = 7;
  const BOOST_SECONDS = 20;
  const DOUBLE_WINDOW_MS = 1500;

  function show() {
    const stageRect = stageEl.getBoundingClientRect();
    const size = 56;
    const left = 30 + Math.random() * (stageRect.width - size - 60);
    const top = 30 + Math.random() * (stageRect.height - size - 40);

    const gy = document.createElement("button");
    gy.id = "golden";
    gy.style.left = left + "px";
    gy.style.top = top + "px";
    gy.title = "Золотое печенье!";
    stageEl.appendChild(gy);

    if (!bannerEl) {
      bannerEl = document.createElement("div");
      bannerEl.id = "golden-banner";
      stageEl.appendChild(bannerEl);
    }
    bannerEl.textContent = "✨ Золотое печенье!";
    bannerEl.style.display = "block";
    bannerEl.style.left = left + "px";

    const clickedAt = Date.now();

    gy.addEventListener("click", function (ev) {
      ev.stopPropagation();
      gy.remove();

      const state = store.get();
      const now = Date.now();
      const quick = now - lastGoldenAt < DOUBLE_WINDOW_MS;
      state.goldenCaught += 1;
      if (quick) state.doubleCookies += 1; else state.doubleCookies = 0;
      store.set(state);

      const mult = quick ? BOOST_MULTIPLIER * 2 : BOOST_MULTIPLIER;
      window.__goldenBoost = {
        multiplier: mult,
        expiresAt: now + BOOST_SECONDS * 1000,
      };

      bannerEl.textContent =
        "🎉 Золотое печенье: клики ×" + mult + " на " + BOOST_SECONDS + " секунд" +
        (quick ? " (цепочка!)" : "");
      setTimeout(function () {
        if (bannerEl) bannerEl.style.display = "none";
      }, 2600);

      window.Sound.play("golden");
      lastGoldenAt = now;
    });
  }

  /* Каждую секунду проверяем: не время ли для нового золотого печенья. */
  function tick() {
    const state = store.get();
    const active = window.GameState.goldenBoost().active;
    if (active) return;
    if (state.totalBaked < 1000) return; // рано: печем первые 1000
    if (document.getElementById("golden")) return; // уже есть на поле
    // ~9% шанс в секунду, реже при маленькой активности
    const p = Math.min(0.09, 0.02 + state.goldenCaught * 0.002);
    if (Math.random() < p) show();
  }

  function init(stateStore, stage) {
    store = stateStore;
    stageEl = stage;
    window.__goldenBoost = null;
  }

  window.Golden = { init, tick };
})();