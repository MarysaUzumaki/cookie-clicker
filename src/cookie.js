/* Большое печенье: рендер, обработка кликов, всплывающие +N, анимация. */
(function () {
  "use strict";

  const W = window;

  function chipSVG() {
    let s = "";
    for (let i = 0; i < 7; i++) {
      const x = 22 + Math.random() * 176;
      const y = 22 + Math.random() * 176;
      const r = 5 + Math.random() * 9;
      s += `<span class="chip" style="width:${r}px;height:${r}px;left:${x}px;top:${y}px;"></span>`;
    }
    return s;
  }

  function render(stage) {
    const btn = document.createElement("button");
    btn.id = "big-cookie";
    btn.innerHTML = chipSVG();
    btn.title = "Кликни меня!";
    stage.appendChild(btn);

    const hint = document.createElement("div");
    hint.id = "clicks-html";
    stage.appendChild(hint);

    return btn;
  }

  function floatNumber(container, x, y, text) {
    const el = document.createElement("span");
    el.className = "floater";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    container.appendChild(el);
    setTimeout(function () { el.remove(); }, 1000);
  }

  function bindClick(stage, btn, hintEl, store) {
    btn.addEventListener("click", function (ev) {
      const state = store.get();
      const power = window.GameState.effectiveClickPower(state);
      state.cookies += power;
      state.totalBaked += power;
      state.clicks += 1;
      store.set(state);

      hintEl.textContent = "Кликов: " + window.U.formatNumber(state.clicks);

      const rect = btn.getBoundingClientRect();
      const x = ev.offsetX - 40;
      const y = ev.offsetY - 16;
      floatNumber(btn, x, y, "+" + window.U.formatNumber(power));
      window.Sound.play("click");
    });
  }

  window.CookieUI = { render, bindClick };
})();