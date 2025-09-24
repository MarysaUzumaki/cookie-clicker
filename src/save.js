/* Сохранение/загрузка в localStorage, экспорт/импорт в base64. */
(function () {
  "use strict";

  const KEY = "cookie-clicker-petbot-save-v1";

  function serialize(state) {
    const copy = JSON.parse(JSON.stringify(state));
    copy.lastSavedAt = Date.now();
    return JSON.stringify(copy);
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, serialize(state));
      return true;
    } catch (e) {
      console.warn("Не удалось сохранить:", e);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const fresh = window.GameState.freshState();
      // merge: подхватываем только известные поля — так сейф стабилен между версиями
      const merged = Object.assign(fresh, parsed);
      merged.buildings = Object.assign(fresh.buildings, parsed.buildings || {});
      merged.upgrades = Object.assign(fresh.upgrades, parsed.upgrades || {});
      merged.discovered = Array.isArray(parsed.discovered) ? parsed.discovered : [];
      if (!merged.startedAt) merged.startedAt = Date.now();
      if (parsed.lastSeenAt) merged.lastSeenAt = parsed.lastSeenAt;
      return merged;
    } catch (e) {
      console.warn("Сохранение повреждено, начинаем сначала:", e);
      return null;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function exportSave(state) {
    return "PETSAVEv1:" + btoa(unescape(encodeURIComponent(serialize(state))));
  }

  function importSave(text) {
    if (typeof text !== "string" || !text.startsWith("PETSAVEv1:")) {
      throw new Error("Не совпадает формат сейва");
    }
    const payload = text.slice("PETSAVEv1:".length);
    const json = decodeURIComponent(escape(atob(payload)));
    const parsed = JSON.parse(json);
    const fresh = window.GameState.freshState();
    const merged = Object.assign(fresh, parsed);
    merged.buildings = Object.assign(fresh.buildings, parsed.buildings || {});
    merged.upgrades = Object.assign(fresh.upgrades, parsed.upgrades || {});
    merged.discovered = Array.isArray(parsed.discovered) ? parsed.discovered : [];
    return merged;
  }

  window.Save = { save, load, clear, exportSave, importSave };
})();