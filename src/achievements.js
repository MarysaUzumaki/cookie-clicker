/* Достижения: список, проверка условий, модалка со списком, уведомления. */
(function () {
  "use strict";

  const ACHIEVEMENTS = [
    { id: "first-100",     name: "Первая сотня",       badge: "🍪", check: a => a.totalBaked >= 100,           desc: "Испечь 100 печений." },
    { id: "first-1k",      name: "Тысячная пекарня",   badge: "🥠", check: a => a.totalBaked >= 1000,          desc: "Испечь 1000 печений." },
    { id: "first-100k",    name: "Сто тысяч крошек",   badge: "🎂", check: a => a.totalBaked >= 1e5,           desc: "Испечь 100 000 печений." },
    { id: "millionaire",   name: "Печеньковый миллионер", badge: "💰", check: a => a.totalBaked >= 1e6,      desc: "Испечь 1 000 000 печений." },
    { id: "billion",       name: "Биллионер крошек",   badge: "💎", check: a => a.totalBaked >= 1e9,           desc: "Испечь 1 000 000 000 печений." },
    { id: "click-50",      name: "Часоклик",           badge: "👆", check: a => a.clicks >= 50,                desc: "Кликнуть 50 раз." },
    { id: "click-1000",    name: "Тысяча кликов",      badge: "🐁", check: a => a.clicks >= 1000,              desc: "Кликнуть 1000 раз." },
    { id: "click-100k",    name: "Усталая рука",       badge: "🖐", check: a => a.clicks >= 1e5,               desc: "Кликнуть 100 000 раз." },
    { id: "build-1",       name: "Первый помощник",    badge: "🖱", check: a => a.buildingsOwned >= 1,         desc: "Купить первое здание." },
    { id: "build-50",      name: "Маленькая фабрика",  badge: "🏭", check: a => a.buildingsOwned >= 50,        desc: "Иметь 50 зданий." },
    { id: "build-500",     name: "Гигантская пекарня", badge: "🏰", check: a => a.buildingsOwned >= 500,       desc: "Иметь 500 зданий." },
    { id: "golden-1",      name: "Золотая лихорадка",  badge: "✨", check: a => a.goldenCaught >= 1,           desc: "Поймать первое золотое печенье." },
    { id: "golden-50",     name: "Золотоискатель",     badge: "🥇", check: a => a.goldenCaught >= 50,          desc: "Поймать 50 золотых печений." },
    { id: "golden-double", name: "Двойная удача",      badge: "🎯", check: a => a.doubleCookies >= 1,          desc: "Поймать два золотых подряд." },
    { id: "encyc-10",      name: "Дегустатор",         badge: "📖", check: a => a.discovered >= 10,            desc: "Открыть 10 печений энциклопедии." },
    { id: "encyc-100",     name: "Коллекционер",       badge: "📚", check: a => a.discovered >= 100,           desc: "Открыть 100 печений энциклопедии." },
    { id: "encyc-1000",    name: "Печеньевед",         badge: "🏛", check: a => a.discovered >= 1000,          desc: "Открыть 1000 печений энциклопедии." },
    { id: "prestige-1",    name: "Перерождение",       badge: "🌅", check: a => a.prestige >= 1,               desc: "Получить первый престиж." },
  ];

  let store = null;
  let toastEl = null;

  function unlocked(state) {
    const adv = window.GameState.computedAdvances(state);
    const list = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (a.check(adv)) list.push(a.id);
    });
    return list;
  }

  function checkNew(state) {
    const done = new Set(state.achievements || []);
    const adv = window.GameState.computedAdvances(state);
    let changed = false;
    ACHIEVEMENTS.forEach(function (a) {
      if (!done.has(a.id) && a.check(adv)) {
        done.add(a.id);
        changed = true;
        toast(a.badge + " " + a.name + " — " + a.desc);
        window.Sound.play("achievement");
      }
    });
    if (changed) {
      state.achievements = Array.from(done);
      return true;
    }
    return false;
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove("show"); }, 3400);
  }

  function openModal() {
    const done = new Set(store.get().achievements || []);
    const body = ACHIEVEMENTS.map(function (a) {
      const ok = done.has(a.id);
      return '<div class="ach ' + (ok ? "done" : "") + '">' +
        '<span class="badge">' + a.badge + '</span>' +
        '<span class="name">' + a.name + '</span>' +
        '<span class="desc">' + a.desc + '</span>' +
        "</div>";
    }).join("");
    window.Modal.open("Достижения", body);
  }

  function init(stateStore, toastNode) {
    store = stateStore;
    toastEl = toastNode;
  }

  window.Achievements = { init, checkNew, unlocked, openModal, ACHIEVEMENTS };
})();