/* Общие утилиты: форматирование больших чисел и экономика. */
(function () {
  "use strict";

  const SUFFIXES = ["", "К", "М", "Б", "Т", "Кв", "Кн", "Ск", "Сп", "Ок", "Но", "Дц", "Ун", "Дд"];

  function formatNumber(n) {
    if (!isFinite(n)) return "∞";
    if (n < 1000) return Math.floor(n).toLocaleString("ru-RU");
    let tier = Math.floor(Math.log10(n) / 3);
    if (tier >= SUFFIXES.length) tier = SUFFIXES.length - 1;
    const scaled = n / Math.pow(1000, tier);
    const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return scaled.toFixed(digits) + " " + SUFFIXES[tier];
  }

  /* Классическая формула Cookie Clicker: цена растёт в 1.15 раза за каждую покупку. */
  function upgradePrice(base, owned) {
    return Math.ceil(base * Math.pow(1.15, owned));
  }

  function formatDuration(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d) return `${d}д ${h}ч`;
    if (h) return `${h}ч ${m}м`;
    if (m) return `${m}м ${s}с`;
    return `${s}с`;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  window.U = { formatNumber, upgradePrice, formatDuration, clamp };
})();