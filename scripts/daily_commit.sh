#!/bin/bash
# Ежедневный автокоммит: добавляет одно новое печенье в энциклопедию и пушит.
# Запускается launchd (com.marysa.cookie-commits). Логи: ./.daily.log
set -u

REPO="$HOME/Desktop/petbot/cookie-clicker"
LOCKDIR="$REPO/.daily.lock"
LOG="$REPO/.daily.log"

if ! mkdir "$LOCKDIR" 2>/dev/null; then
    echo "$(date +%F\ %T) SKIP: другой запуск ещё выполняется" >> "$LOG"
    exit 0
fi

cd "$REPO" || { rmdir "$LOCKDIR"; exit 1; }

# Один коммит в сутки (по UTC) — защита от повторных срабатываний
TODAY=$(date -u +%Y-%m-%d)
LASTDAY=$(git log -1 --format=%ad --date=format:%Y-%m-%d 2>/dev/null || echo never)
if [ "$LASTDAY" = "$TODAY" ] && [ "${FORCE:-0}" != "1" ]; then
    echo "$(date +%F\ %T) SKIP: коммит за сегодня уже есть" >> "$LOG"
    rmdir "$LOCKDIR"; exit 0
fi

TMP=$(mktemp -d /tmp/cc.XXXXXX) || exit 1
trap 'rm -rf "$TMP"' EXIT

# Синхронизация с удалёнкой (вдруг запущено с другой машины)
git fetch -q origin main 2>>"$LOG" || true
git pull --rebase --autostash -q origin main 2>>"$LOG" || true

# Продолжение кривой value: последнее значение × 1.05
TOP=$(python3 -c "
import json
line = open('data/cookies.jsonl', encoding='utf-8').read().splitlines()[-1]
v = float(json.loads(line)['value'])
print(int(v * 1.05))
")

if ! python3 scripts/continue_cookies.py --count 1 --from-file data/cookies.jsonl \
        --top "$TOP" --out "$TMP/c.jsonl" --msgs "$TMP/m.txt" >>"$LOG" 2>&1; then
    echo "$(date +%F\ %T) ОШИБКА генератора" >> "$LOG"
    rmdir "$LOCKDIR"; exit 1
fi

MSG=$(cat "$TMP/m.txt")
cat "$TMP/c.jsonl" >> data/cookies.jsonl
python3 scripts/build_data.py >/dev/null 2>&1

git add data/cookies.jsonl src/data/cookies.js
git commit -q -m "$MSG" || true
git push -q origin main 2>>"$LOG" || true

echo "$(date +%F\ %T) COMMIT: $MSG" >> "$LOG"
rmdir "$LOCKDIR"
exit 0