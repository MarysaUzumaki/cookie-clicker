/* Печеньевая энциклопедия: открытие новых печений по мере накопления крошек,
   бонус CPS за каждое найденное, модалка-справочник с фильтрами по редкости. */
(function () {
  "use strict";

  let store = null;
  let lastCheck = 0;
  let modalBodyEl = null;

  const RARITY_ORDER = ["Редкое", "Необычное", "Обычное", "Легендарное", "Эпическое", "Мифическое"];
  const RARITY_COLOR = {
    "Обычное": "#9aa06b",
    "Необычное": "#7ec8a3",
    "Редкое": "#6fa8dc",
    "Эпическое": "#b07ce8",
    "Легендарное": "#ffd24d",
    "Мифическое": "#ff5f9e",
  };

  function discoveredCount(state) {
    return (state.discovered || []).length;
  }

  function totalCount() {
    return window.GameData.allCookies().length;
  }

  /* Пассивное открытие: проверяем группу печений с порогом ниже totalBaked. */
  function refreshProgress(state) {
    const now = Date.now();
    if (now - lastCheck < 500) return 0;
    lastCheck = now;
    if (totalCount() === 0) return 0;
    const have = new Set(state.discovered || []);
    let added = 0;
    window.GameData.allCookies().forEach(function (c) {
      if (!have.has(c.id) && state.totalBaked >= c.value) {
        have.add(c.id);
        added += 1;
      }
    });
    if (added > 0) {
      state.discovered = Array.from(have);
      const word = added === 1 ? "печенье" : (added < 5 ? "печенья" : "печений");
      window.Achievements.toast("📖 Открыто " + added + " " + word + " в энциклопедии");
      window.Sound.play("achievement");
    }
    return added;
  }

  function entryHTML(c, discovered) {
    const color = RARITY_COLOR[c.rarity] || "#bbb";
    const found = discovered.indexOf(c.id) !== -1;
    return '<div class="entry ' + (found ? "" : "locked") + '">' +
      '<div><span class="rarity-tag" style="background:' + color + '">' + c.rarity + "</span></div>" +
      "<div><b>" + c.name + "</b><div class=\"meta\">" +
      (found
        ? "Порог: " + window.U.formatNumber(c.value) + " · бонус " + window.U.formatNumber(c.bonus) +
          "% CPS · «" + c.flavor + "»"
        : "Не открыто — нужен порог " + window.U.formatNumber(c.value)) +
      "</div></div></div>";
  }

  function openModal(filterRarity) {
    const state = store.get();
    const disc = state.discovered || [];
    const all = window.GameData.allCookies();
    const filtered = filterRarity ? all.filter(function (c) { return c.rarity === filterRarity; }) : all;
    const foundCount = filtered.filter(function (c) { return disc.indexOf(c.id) !== -1; }).length;

    const summary = RARITY_ORDER.map(function (r) {
      const total = all.filter(function (c) { return c.rarity === r; }).length;
      if (total === 0) return "";
      const found = all.filter(function (c) { return c.rarity === r && disc.indexOf(c.id) !== -1; }).length;
      return '<button class="btn ghost rarity-filter" data-r="' + r + '" style="margin:2px">' +
        r + " " + found + "/" + total + "</button>";
    }).join("");

    const body = "<p>Открыто: <b>" + foundCount + "</b> из " + filtered.length + "</p>" +
      '<div style="margin:8px 0">' + summary + "</div>" +
      '<div id="encyc-list">' + filtered.map(function (c) { return entryHTML(c, disc); }).join("") + "</div>";

    modalBodyEl = document.createElement("div");
    modalBodyEl.innerHTML = body;
    window.Modal.open("📚 Печеньевая энциклопедия · " + disc.length + "/" + all.length, modalBodyEl);

    document.getElementById("encyc-list").style.maxHeight = "48vh";
    document.getElementById("encyc-list").style.overflowY = "auto";

    modalBodyEl.querySelectorAll(".rarity-filter").forEach(function (b) {
      b.addEventListener("click", function () { openModal(b.dataset.r); });
    });
  }

  function init(stateStore) {
    store = stateStore;
  }

  window.Encyclopedia = { init, refreshProgress, openModal, discoveredCount, totalCount };
})();