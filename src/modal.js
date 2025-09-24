/* Простая модалка: подложка + окно с заголовком и содержимым (строка или узел). */
(function () {
  "use strict";

  let backdrop = null;

  function ensureBackdrop() {
    if (backdrop) return backdrop;
    backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.addEventListener("click", function (ev) {
      if (ev.target === backdrop) close();
    });
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function open(title, content) {
    const bd = ensureBackdrop();
    bd.innerHTML =
      '<div class="modal"><h2></h2><button class="close" title="Закрыть">✕</button><div class="modal-body"></div></div>';
    const titleEl = bd.querySelector("h2");
    const bodyEl = bd.querySelector(".modal-body");
    titleEl.innerHTML = title;
    if (content instanceof Node) bodyEl.appendChild(content);
    else bodyEl.innerHTML = content;
    bd.querySelector(".close").addEventListener("click", close);
    bd.classList.add("open");
  }

  function close() {
    if (backdrop) backdrop.classList.remove("open");
  }

  window.Modal = { open, close };
})();