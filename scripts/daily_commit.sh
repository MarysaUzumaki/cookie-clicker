#!/bin/bash
# Ежедневный автокоммит: до 140 печений в сутки (команды по 25 → push), чтобы график был плотным.
# Запускается launchd (com.marysa.cookie-commits). Логи: ./.daily.log
set -u

REPO="$HOME/Desktop/petbot/cookie-clicker"
LOCKDIR="$REPO/.daily.lock"
LOG="$REPO/.daily.log"
TARGET="${TARGET:-140}"
AUTHOR="149891978+MarysaUzumaki@users.noreply.github.com"
TZOFF="+0500"

if ! mkdir "$LOCKDIR" 2>/dev/null; then
    echo "$(date +%F\ %T) SKIP: другой запуск ещё выполняется" >> "$LOG"
    exit 0
fi
cd "$REPO" || { rmdir "$LOCKDIR"; exit 1; }

TODAY_UTC=$(date -u +%Y-%m-%d)
DONE=$(git rev-list --count HEAD --since="$TODAY_UTC"T00:00:00Z 2>/dev/null || echo 0)
NEED=$((TARGET - DONE))
if [ "$NEED" -le 0 ]; then
    echo "$(date +%F\ %T) SKIP: сегодня уже $DONE (>= $TARGET)" >> "$LOG"
    rmdir "$LOCKDIR"; exit 0
fi
[ "$NEED" -gt 400 ] && NEED=400

git fetch -q origin main 2>>"$LOG" || true
git pull --rebase --autostash -q origin main 2>>"$LOG" || true

TMP=$(mktemp -d /tmp/cc.XXXXXX) || exit 1
trap 'rm -rf "$TMP"' EXIT

TOP=$(python3 -c "
import json
last = open('data/cookies.jsonl', encoding='utf-8').read().splitlines()[-1]
v = float(json.loads(last)['value'])
print(int(v * 1.05))
")

python3 scripts/continue_cookies.py --count "$NEED" --from-file data/cookies.jsonl \
    --top "$TOP" --out "$TMP/c.jsonl" --msgs "$TMP/m.txt" >>"$LOG" 2>&1 || { rmdir "$LOCKDIR"; exit 1; }

python3 - "$NEED" "$TMP" "$TZOFF" <<'PY'
import json, sys, datetime as dt
need, tmp, tz = int(sys.argv[1]), sys.argv[2], sys.argv[3]
off = dt.timedelta(hours=5) if tz == "+0500" else dt.timedelta(hours=int(tz[1:3]) * (1 if tz[0]=="+" else -1))
zone = dt.timezone(off)
rows = [json.loads(l) for l in open(tmp+"/c.jsonl", encoding="utf-8").read().splitlines()]
rows.sort(key=lambda o: (o["value"], o["id"]))
base = int(rows[0]["id"])
for j, o in enumerate(rows):
    o["id"] = str(base + j)
open(tmp+"/c.jsonl", "w", encoding="utf-8").write("\n".join(json.dumps(o, ensure_ascii=False) for o in rows) + "\n")
open(tmp+"/m.txt", "w", encoding="utf-8").write("\n".join("Добавить печенье «"+o["name"]+"» ("+o["rarity"]+")" for o in rows) + "\n")
now = dt.datetime.now(zone)
start = max(now, now.replace(hour=10, minute=0, second=0, microsecond=0))
end = now.replace(hour=23, minute=40, second=0, microsecond=0)
if start >= end:
    start = now + dt.timedelta(seconds=1); end = now + dt.timedelta(seconds=5 * need)
step = (end - start).total_seconds() / max(1, need - 1)
fmt = "%Y-%m-%d %H:%M:%S " + tz
open(tmp+"/dates.txt", "w").write("\n".join((start + dt.timedelta(seconds=step * i)).strftime(fmt) for i in range(need)) + "\n")
print(f"planned {need} commits, from {(start).strftime('%H:%M')} to {(end).strftime('%H:%M')}")
PY

j=0
while IFS= read -r date; do
    j=$((j+1))
    sed -n "${j}p" "$TMP/c.jsonl" >> data/cookies.jsonl
    msg=$(sed -n "${j}p" "$TMP/m.txt")
    if [ "$j" -eq "$NEED" ]; then python3 scripts/build_data.py >/dev/null 2>&1; fi
    git add data/cookies.jsonl src/data/cookies.js 2>/dev/null
    GIT_AUTHOR_EMAIL="$AUTHOR" GIT_COMMITTER_EMAIL="$AUTHOR" \
      GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" \
      git commit -q -m "$msg" || true
    if [ $((j % 25)) -eq 0 ]; then git push -q origin main 2>>"$LOG" || true; fi
done < "$TMP/dates.txt"

git push -q origin main 2>>"$LOG" || true
echo "$(date +%F\ %T) OK: +$NEED коммитов (всего сегодня $((DONE + NEED)))" >> "$LOG"
rmdir "$LOCKDIR"
exit 0