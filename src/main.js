/* Точка входа: сборка интерфейса, игровой цикл, автосохранение. */
(function () {
  "use strict";

  function buildLayout() {
    const app = document.getElementById("app");

    const topbar = document.createElement("div");
    topbar.id = "topbar";

    const bankWrap = document.createElement("div");
    bankWrap.innerHTML = '<div class="bank" id="bank-count">0 🍪</div><div class="cps" id="cps-count">CPS: 0</div>';
    topbar.appendChild(bankWrap);

    const btns = document.createElement("div");
    btns.id = "topbar-buttons";
    btns.style.display = "flex";
    btns.style.gap = "8px";

    function drawerBtn(label, handler) {
      const b = document.createElement("button");
      b.className = "drawer-btn";
      b.textContent = label;
      b.addEventListener("click", handler);
      btns.appendChild(b);
      return b;
    }

    drawerBtn("🏆 Достижения", () => window.Achievements.openModal());
    drawerBtn("📊 Статистика", () => window.Stats.openModal());
    drawerBtn("📖 Энциклопедия", () => window.Encyclopedia.openModal());
    drawerBtn("🌅 Престиж", () => window.Prestige.openModal());
    drawerBtn("⚙ Настройки", () => window.Settings.openModal());
    topbar.appendChild(btns);
    app.appendChild(topbar);

    const stage = document.createElement("div");
    stage.id = "stage";
    app.appendChild(stage);

    const shop = document.createElement("div");
    shop.id = "shop";
    app.appendChild(shop);

    const toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);

    return { bank: bankWrap.querySelector(".bank"), cpsEl: bankWrap.querySelector(".cps"), stage, shop, toast };
  }

  function gameLoop(store, ui) {
    setInterval(function () {
      const state = store.get();
      const gain = window.GameState.cps(state);
      if (gain > 0) {
        state.cookies += gain;
        state.totalBaked += gain;
      }

      if (window.Achievements.checkNew(state)) { /* возможно уже мутировал achievements */ }
      if (window.Encyclopedia.refreshProgress(state) > 0) { /* добавились открытия */ }

      window.Golden.tick();
      window.Shop.refresh(state);
      ui.cpsEl.textContent = "CPS: " + window.U.formatNumber(gain);
      const boost = window.GameState.goldenBoost();
      if (boost.active) {
        ui.cpsEl.textContent += "  ·  ☀ буст ×" + boost.multiplier + " (" + Math.ceil(boost.left) + "с)";
      }
      store.set(state);
    }, 1000);
  }

  function autosave(store) {
    setInterval(function () {
      const state = store.get();
      state.lastSavedAt = Date.now();
      window.Save.save(state);
    }, 10000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const store = (function () {
      let s = window.Save.load() || window.GameState.freshState();
      if (!s.achievements) s.achievements = [];
      return {
        get: function () { return s; },
        set: function (next) { s = next; window.Save.save(s); },
      };
    })();

    const ui = buildLayout();

    window.Achievements.init(store, ui.toast);
    window.Stats.init(store);
    window.Prestige.init(store);
    window.Encyclopedia.init(store);
    window.Settings.init(store);
    window.Golden.init(store, ui.stage);
    window.Shop.init({ store: store, shopEl: ui.shop });

    const btn = window.CookieUI.render(ui.stage);
    window.CookieUI.bindClick(ui.stage, btn, ui.stage.querySelector("#clicks-html"), store);

    window.Offline.apply(stateNow(store));
    store.set(store.get());

    ui.bank.textContent = window.U.formatNumber(store.get().cookies) + " 🍪";
    function refreshBank() {
      const st = store.get();
      ui.bank.textContent = window.U.formatNumber(st.cookies) + " 🍪";
    }
    setInterval(refreshBank, 250); // отзывчивый счётчик между секундными тиками

    gameLoop(store, ui);
    autosave(store);
  });

  function stateNow(store) { return store.get(); }
})();