/* Оффлайн-прогресс: пока игра закрыта, пекарня продолжает работать (лимит 8 часов). */
(function () {
  "use strict";

  const MAX_OFFLINE_SECONDS = 8 * 3600;

  function compute(state) {
    const elapsed = Math.max(0, (Date.now() - (state.lastSeenAt || state.startedAt)) / 1000);
    const capped = Math.min(elapsed, MAX_OFFLINE_SECONDS);
    const gained = capped * window.GameState.cps(state);
    return { seconds: capped, gained: gained };
  }

  function apply(state) {
    const r = compute(state);
    if (r.seconds >= 30 && r.gained >= 1) {
      state.cookies += r.gained;
      state.totalBaked += r.gained;
      window.Modal.open("🛋 Пока вас не было",
        "Пекарня работала " + window.U.formatDuration(r.seconds) +
        " и испекла <b>" + window.U.formatNumber(r.gained) + "</b> печений.");
    }
    state.lastSeenAt = Date.now();
    return state;
  }

  window.Offline = { compute, apply };
})();