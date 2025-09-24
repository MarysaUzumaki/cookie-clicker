/* Игровое состояние: количество печенья, постройки, апгрейды, счётчики, престиж.
   Вычисление CPS и силы клика живёт здесь же. */
(function () {
  "use strict";

  function freshState() {
    return {
      cookies: 0,          // доступное печенье
      totalBaked: 0,       // испечено за всё время (слёту)
      clicks: 0,           // всего кликов по печенью
      goldenCaught: 0,
      buildings: {},       // id -> owned count
      upgrades: {},        // id -> true
      discovered: [],      // id печений, найденных в энциклопедии
      doubleCookies: 0,    // поймано двойных золотых подряд
      prestige: 0,         // беспокойные души (престиж)
      totalResets: 0,
      startedAt: Date.now(),
      lastSavedAt: Date.now(),
      lastSeenAt: Date.now(),
    };
  }

  function buildingMult(state) {
    let mult = 1;
    const gd = window.GameData;
    gd.UPGRADES.forEach(function (u) {
      if (u.effect.type === "building" && state.upgrades[u.id]) {
        mult *= (state.upgrades[u.id] ? u.effect.mult : 1);
      }
    });
    return mult;
  }

  function buildingsOwned(state) {
    let sum = 0;
    for (const k in state.buildings) sum += state.buildings[k];
    return sum;
  }

  /* Печенье в секунду: сумма cps зданий × множители апгрейдов, ×2 за престиж. */
  function cps(state) {
    let v = 0;
    const mult = buildingMult(state);
    const gd = window.GameData;
    gd.BUILDINGS.forEach(function (b) {
      const owned = state.buildings[b.id] || 0;
      v += owned * b.cps * mult;
    });
    if (state.prestige > 0) v *= Math.pow(2, state.prestige);
    return v;
  }

  /* Сила клика: база 1 × апгрейды клика × 2% от CPS (как в оригинале), × престиж. */
  function clickPower(state) {
    let v = 1;
    const gd = window.GameData;
    gd.UPGRADES.forEach(function (u) {
      if (u.effect.type === "click" && state.upgrades[u.id]) v *= u.effect.mult;
    });
    v += cps(state) * 0.02;
    if (state.prestige > 0) v *= Math.pow(2, state.prestige);
    return v;
  }

  /* Золотые печенья дают временный буст кликам (multiplier, осталось секунд). */
  function goldenBoost() {
    const g = window.__goldenBoost;
    if (!g) return { active: false, multiplier: 1, left: 0 };
    const left = (g.expiresAt - Date.now()) / 1000;
    if (left <= 0) { window.__goldenBoost = null; return { active: false, multiplier: 1, left: 0 }; }
    return { active: true, multiplier: g.multiplier, left: left };
  }

  function effectiveClickPower(state) {
    return clickPower(state) * (goldenBoost().active ? goldenBoost().multiplier : 1);
  }

  /* Достижения, открываемые проверкой состояния. */
  function computedAdvances(state) {
    return {
      totalBaked: state.totalBaked,
      cookies: state.cookies,
      buildingsOwned: buildingsOwned(state),
      clicks: state.clicks,
      goldenCaught: state.goldenCaught,
      doubleCookies: state.doubleCookies,
      discovered: state.discovered.length,
    };
  }

  window.GameState = {
    freshState,
    cps,
    clickPower,
    effectiveClickPower,
    goldenBoost,
    buildingsOwned,
    computedAdvances,
  };
})();