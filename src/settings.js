/* Настройки: громкость, звук вкл/выкл, экспорт/импорт сейва, жёсткий сброс. */
(function () {
  "use strict";

  let store = null;

  function openModal() {
    const curVol = window.U.clamp(parseFloat(localStorage.getItem("pet-settings-volume") || "") || 0.4, 0, 1);
    const curMute = localStorage.getItem("pet-settings-mute") === "1";
    const body =
      '<div class="setting-row"><span>Громкость</span>' +
      '<input type="range" id="set-vol" min="0" max="1" step="0.05" value="' + curVol + '"></div>' +
      '<div class="setting-row"><span>Звук</span>' +
      '<input type="checkbox" id="set-mute" ' + (curMute ? "checked" : "") + "></div>" +
      '<div class="setting-row"><span>Экспорт сейва</span>' +
      '<button class="btn ghost" id="set-export">Скопировать</button></div>' +
      '<div class="setting-row"><span>Импорт сейва</span>' +
      '<input type="text" id="set-import" placeholder="PETSAVEv1:…" style="width:60%"></div>' +
      '<div class="setting-row"><span>Жёсткий сброс</span>' +
      '<button class="btn danger" id="set-reset">Стереть всё</button></div>';

    window.Modal.open("⚙ Настройки", body);

    const vol = document.getElementById("set-vol");
    const mute = document.getElementById("set-mute");

    vol.addEventListener("input", function () {
      localStorage.setItem("pet-settings-volume", vol.value);
      window.Sound.setVolume(parseFloat(vol.value));
    });
    mute.addEventListener("change", function () {
      localStorage.setItem("pet-settings-mute", mute.checked ? "1" : "0");
      window.Sound.setMuted(mute.checked);
    });

    document.getElementById("set-export").addEventListener("click", function () {
      const text = window.Save.exportSave(store.get());
      try {
        navigator.clipboard.writeText(text);
        window.Achievements.toast && window.Achievements.toast("Сейв скопирован в буфер");
      } catch (e) {
        prompt("Скопируйте вручную:", text);
      }
    });

    document.getElementById("set-import").addEventListener("keydown", async function (ev) {
      if (ev.key !== "Enter") return;
      try {
        const next = window.Save.importSave(this.value.trim());
        store.set(next);
        window.Achievements.toast && window.Achievements.toast("Сейв импортирован ✅");
      } catch (e) {
        window.Achievements.toast && window.Achievements.toast("Не удалось импортировать ✖");
      }
    });

    document.getElementById("set-reset").addEventListener("click", function () {
      if (confirm("Точно стереть всю пекарню? Это действие нельзя отменить.")) {
        window.Save.clear();
        store.set(window.GameState.freshState());
        window.Modal.close();
      }
    });
  }

  function apply() {
    const vol = window.U.clamp(parseFloat(localStorage.getItem("pet-settings-volume") || "") || 0.4, 0, 1);
    const mute = localStorage.getItem("pet-settings-mute") === "1";
    window.Sound.setVolume(vol);
    window.Sound.setMuted(mute);
  }

  function init(stateStore) {
    store = stateStore;
    apply();
  }

  window.Settings = { init, openModal };
})();