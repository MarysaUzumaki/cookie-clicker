/* Статистика: модалка с показателями прогресса и игровой активности. */
(function () {
  "use strict";

  let store = null;

  function rows(state) {
    const upgs = Object.keys(state.upgrades).length;
    const playSeconds = (Date.now() - state.startedAt) / 1000;
    return [
      ["Печенья сейчас", window.U.formatNumber(state.cookies)],
      ["Испечено всего", window.U.formatNumber(state.totalBaked)],
      ["В секунду (CPS)", window.U.formatNumber(window.GameState.cps(state))],
      ["Кликов по печенью", window.U.formatNumber(state.clicks)],
      ["Сила клика", window.U.formatNumber(window.GameState.clickPower(state))],
      ["Зданий куплено", String(window.GameState.buildingsOwned(state))],
      ["Улучшений куплено", String(upgs)],
      ["Золотых поймано", String(state.goldenCaught)],
      ["Двойных серий", String(state.doubleCookies)],
      ["Печений энциклопедии", String(state.discovered.length)],
      ["Престиж", String(state.prestige)],
      ["Перерождений", String(state.totalResets)],
      ["Время в игре", window.U.formatDuration(playSeconds)],
    ];
  }

  function openModal() {
    const state = store.get();
    const body = '<div class="stats-grid">' + rows(state).map(function (r) {
      return '<div>' + r[0] + '</div><div class="v">' + r[1] + "</div>";
    }).join("") + "</div>";
    window.Modal.open("Статистика", body);
  }

  function init(stateStore) {
    store = stateStore;
  }

  window.Stats = { init, openModal };
})();