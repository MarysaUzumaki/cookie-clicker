/* Престиж: сброс пекарни за вечный срок «душ» (беспокойных крошек).
   Текущее испечённое конвертируется в хард-валюту, которая удваивает CPS и клики. */
(function () {
  "use strict";

  let store = null;

  /* Сколько душ даст сброс: sqrt(totalBaked / 1e6). */
  function pendingPrestige(state) {
    if (state.totalBaked < 1e6) return 0;
    return Math.floor(Math.sqrt(state.totalBaked / 1e6));
  }

  function canReset(state) {
    return state.totalBaked >= 1e6 && pendingPrestige(state) > state.prestige;
  }

  function reset(state) {
    const gain = pendingPrestige(state);
    if (gain <= 0) return null;
    const fresh = window.GameState.freshState();
    fresh.prestige = gain;
    fresh.totalBaked = 0;
    fresh.totalResets = state.totalResets + 1;
    fresh.startedAt = state.startedAt;
    fresh.lastSeenAt = Date.now();
    window.Sound.play("prestige");
    return fresh;
  }

  function openModal() {
    const state = store.get();
    const gain = pendingPrestige(state);
    const body =
      "<p>Сброс пекарни за <b>" + gain + "</b> душ" + plural(gain) + ".</p>" +
      "<p>Престиж удваивает CPS и силу клика. Всё здания и улучшения будут потеряны.</p>" +
      '<p style="margin-top:12px"><button class="btn danger" id="do-prestige">Переродиться</button></p>';

    window.Modal.open("🌅 Престиж", body);
    const btn = document.getElementById("do-prestige");
    if (btn) {
      btn.addEventListener("click", function () {
        const s = store.get();
        const next = reset(s);
        if (next) {
          store.set(next);
          window.Modal.close();
        }
      });
    }
  }

  function plural(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "а";
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "и";
    return "";
  }

  function init(stateStore) {
    store = stateStore;
  }

  window.Prestige = { init, pendingPrestige, canReset, reset, openModal };
})();