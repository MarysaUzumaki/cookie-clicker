/* Статические игровые данные: здания, апгрейды, обёртка над энциклопедией.
   Энциклопедия загружается из генерируемого бандла src/data/cookies.js. */
(function () {
  "use strict";

  /* Каждое здание: цена базовая (base), печенья/сек (cps), имя и описание.
     Цена растёт по формуле U.upgradePrice(base, owned). */
  const BUILDINGS = [
    { id: "cursor",   name: "Курсор",               base: 15,      cps: 0.1,  icon: "🖱",  desc: "Верный помощник, который кликает сам каждые 10 секунд." },
    { id: "grandma",  name: "Бабушка",              base: 100,     cps: 1,    icon: "👵",  desc: "Испечёт печенье и штук, и за штукой." },
    { id: "farm",     name: "Ферма печенек",        base: 1100,    cps: 8,    icon: "🍪",  desc: "Полное поле печений. Обычные не сравнить." },
    { id: "mine",     name: "Шахта печенья",        base: 12000,   cps: 47,   icon: "⛏",  desc: "Полкило руды печенья в минуту." },
    { id: "factory",  name: "Фабрика печенья",      base: 130000,  cps: 260,  icon: "🏭",  desc: "Конвейер, который не оставляет крошек без дела." },
    { id: "bank",     name: "Печенье-банк",         base: 1.4e6,   cps: 1400, icon: "🏦",  desc: "Держит ваше печенье в безопасности и приумножает проценты." },
    { id: "temple",   name: "Храм печенья",         base: 20e6,    cps: 7800, icon: "⛩",  desc: "Место силы для самых преданных печеньеедов." },
    { id: "tower",    name: "Печеньная башня",      base: 330e6,   cps: 44000, icon: "🧙",  desc: "Переиспользует плесень, чтобы печь печенье из ничего." },
    { id: "shipment", name: "Корабль печенек",      base: 5.1e9,   cps: 260000, icon: "🚀", desc: "Космический грузовик с печеньем на орбите." },
    { id: "lab",      name: "Алхимическая лаба",    base: 75e9,    cps: 1.6e6, icon: "⚗",  desc: "Превращает свинец в печенье. Почти." },
    { id: "portal",   name: "Портал печенья",       base: 1e12,    cps: 1e7,  icon: "🌀",  desc: "Открывает путь в Измерение Печенья." },
    { id: "machine",  name: "Машина времени печений", base: 14e12, cps: 65e6, icon: "⏰", desc: "Печёт печенье из будущего — оно уже устарело, но вкусно." },
  ];

  /* Апгрейды: покупаются один раз и усиливают силу клика или здания. */
  const UPGRADES = [
    { id: "click-1",  name: "Сильный клик",        desc: "Клик даёт в 1.5 раза больше печенья.",        effect: { type: "click", mult: 1.5 }, cost: 100 },
    { id: "click-2",  name: "Клик чемпиона",       desc: "Клик даёт в 2 раза больше печенья.",          effect: { type: "click", mult: 2 },   cost: 12000 },
    { id: "click-3",  name: "Клик мастера крошек", desc: "Клик даёт в 3 раза больше печенья.",          effect: { type: "click", mult: 3 },   cost: 4e6 },
    { id: "cursor-2", name: "Масло для курсоров",  desc: "Курсоры дают вдвое больше.",                  effect: { type: "building", building: "cursor",  mult: 2 }, cost: 100 },
    { id: "grandma-2",name: "Любимая бабушка",     desc: "Бабушки пекут вдвое больше.",                 effect: { type: "building", building: "grandma",  mult: 2 }, cost: 1000 },
    { id: "farm-2",   name: "Генплан фермы",       desc: "Фермы дают вдвое больше.",                    effect: { type: "building", building: "farm",     mult: 2 }, cost: 12000 },
    { id: "mine-2",   name: "Золотоносная жила",   desc: "Шахты дают вдвое больше.",                    effect: { type: "building", building: "mine",     mult: 2 }, cost: 120000 },
    { id: "factory-2",name: "Ночная смена",        desc: "Фабрики работают вдвое больше.",              effect: { type: "building", building: "factory",  mult: 2 }, cost: 1.4e6 },
    { id: "bank-2",   name: "Сложный процент",     desc: "Банки приносят вдвое больше.",                effect: { type: "building", building: "bank",     mult: 2 }, cost: 20e6 },
    { id: "temple-2", name: "Великий пост",        desc: "Храмы благословляют вдвое сильнее.",          effect: { type: "building", building: "temple",   mult: 2 }, cost: 330e6 },
    { id: "tower-2",  name: "Тайные ритуалы",      desc: "Башни колдуют вдвое больше печенья.",         effect: { type: "building", building: "tower",    mult: 2 }, cost: 5.1e9 },
    { id: "ship-2",   name: "Маршрут упрощён",     desc: "Корабли привозят вдвое больше.",              effect: { type: "building", building: "shipment", mult: 2 }, cost: 75e9 },
  ];

  /* Энциклопедия загружается из бандла src/data/cookies.js (window.COOKIE_ENCYCLOPEDIA). */
  function allCookies() {
    const raw = window.COOKIE_ENCYCLOPEDIA || [];
    return raw.map(function (c) {
      return {
        id: c.id,
        name: c.name,
        rarity: c.rarity,
        value: c.value,
        bonus: c.bonus,
        flavor: c.flavor,
      };
    });
  }

  window.GameData = { BUILDINGS, UPGRADES, allCookies };
})();