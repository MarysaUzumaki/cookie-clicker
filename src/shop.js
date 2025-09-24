/* Магазин: список зданий и апгрейдов, покупка, авто-продажа апгрейдов по порогам. */
(function () {
  "use strict";

  let store = null;
  let shopEl = null;
  let order = [];      // порядок кнопок: {type:'building'|'upgrade', id}
  let onUpgradeBought = null;

  function priceFor(state, item) {
    if (item.type === "building") {
      const def = Object.values(window.GameData.BUILDINGS).find(function (b) { return b.id === item.id; });
      return window.U.upgradePrice(def.base, state.buildings[item.id] || 0);
    }
    const def = window.GameData.UPGRADES.find(function (u) { return u.id === item.id; });
    return def.cost;
  }

  function renderList() {
    if (!shopEl) return;

    // Раздел «Здания»
    shopEl.innerHTML = "";
    const h = document.createElement("h2");
    h.textContent = "Магазин";
    shopEl.appendChild(h);

    const buildingsH = document.createElement("div");
    buildingsH.id = "buildings-list";
    shopEl.appendChild(buildingsH);

    const upgH = document.createElement("div");
    upgH.id = "upgrades-list";
    const upgTitle = document.createElement("h2");
    upgTitle.textContent = "Улучшения";
    upgTitle.style.marginTop = "14px";
    shopEl.appendChild(upgTitle);
    shopEl.appendChild(upgH);

    window.GameData.BUILDINGS.forEach(function (b) {
      const bEl = document.createElement("div");
      bEl.className = "shop-item";
      bEl.dataset.id = b.id;
      buildingsH.appendChild(bEl);
    });

    window.GameData.UPGRADES.forEach(function (u) {
      const uEl = document.createElement("div");
      uEl.className = "shop-item";
      uEl.dataset.id = u.id;
      upgH.appendChild(uEl);
    });
  }

  function buyBuilding(state, def) {
    const owned = state.buildings[def.id] || 0;
    const price = window.U.upgradePrice(def.base, owned);
    if (state.cookies < price) { window.Sound.play("error"); return false; }
    state.cookies -= price;
    state.buildings[def.id] = owned + 1;
    return true;
  }

  function buyUpgrade(state, def) {
    if (state.upgrades[def.id]) return false;
    if (state.cookies < def.cost) { window.Sound.play("error"); return false; }
    state.cookies -= def.cost;
    state.upgrades[def.id] = true;
    if (onUpgradeBought) onUpgradeBought(def);
    return true;
  }

  function buy(state, type, id) {
    let ok = false;
    if (type === "building") {
      const def = window.GameData.BUILDINGS.find(function (b) { return b.id === id; });
      ok = def && buyBuilding(state, def);
    } else {
      const def = window.GameData.UPGRADES.find(function (u) { return u.id === id; });
      ok = def && buyUpgrade(state, def);
    }
    if (ok) window.Sound.play("buy");
    return ok;
  }

  function upgradeVisible(state, def) {
    // Апгрейд открывается, когда куплено хотя бы 1 здание соответствующего типа (для зданий),
    // либо кликовые апгрейды — сразу.
    if (def.effect.type === "click") return state.clicks >= 10;
    const owned = state.buildings[def.effect.building] || 0;
    return owned >= 1;
  }

  function refresh(state) {
    const buildingsList = document.getElementById("buildings-list");
    const upgradesList = document.getElementById("upgrades-list");

    window.GameData.BUILDINGS.forEach(function (b) {
      const el = buildingsList.querySelector("[data-id='" + b.id + "']");
      const owned = state.buildings[b.id] || 0;
      const price = window.U.upgradePrice(b.base, owned);
      el.innerHTML =
        '<div class="name">' + b.icon + " " + b.name + ' <span class="owned">×' + owned + '</span></div>' +
        '<div class="price">' + window.U.formatNumber(price) + " 🍪</div>" +
        '<div class="desc">' + b.desc + "</div>";
      el.disabled = state.cookies < price;
      if (el.boundBuy !== b) {
        el.boundBuy = b;
        el.addEventListener("click", function () {
          const s = store.get();
          if (buy(s, "building", b.id)) store.set(s);
        });
      }
    });

    window.GameData.UPGRADES.forEach(function (u) {
      const el = upgradesList.querySelector("[data-id='" + u.id + "']");
      const bought = !!state.upgrades[u.id];
      const visible = upgradeVisible(state, u);
      const title = bought ? "✔ " + u.name : u.name;
      el.innerHTML =
        '<div class="name">' + title + '</div>' +
        '<div class="price">' + window.U.formatNumber(u.cost) + " 🍪</div>" +
        '<div class="desc">' + u.desc + "</div>";
      el.disabled = bought || !visible || state.cookies < u.cost;
      if (!visible) el.style.display = "none"; else el.style.display = "";
      if (el.boundBuy !== u) {
        el.boundBuy = u;
        el.addEventListener("click", function () {
          const s = store.get();
          if (buy(s, "upgrade", u.id)) store.set(s);
        });
      }
    });
  }

  function init(opts) {
    store = opts.store;
    shopEl = opts.shopEl;
    onUpgradeBought = opts.onUpgradeBought || null;
    renderList();
  }

  window.Shop = { init, refresh, buy };
})();