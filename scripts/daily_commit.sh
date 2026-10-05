#!/bin/bash
# Ежедневный автокоммит: до 140 печений в сутки + дозаполнение пропущенных дней.
# Запускается launchd (com.marysa.cookie-commits, StartInterval 3600).
# ВАЖНО: репозиторий автокоммита живёт вне ~/Desktop — процессы launchd
# не имеют прав на Desktop (macOS TCC) и там умирают с "Operation not permitted".
# Логи: <repo>/.daily.log
set -u

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCKDIR="$REPO/.daily.lock"
LOG="$REPO/.daily.log"
TARGET="${TARGET:-140}"
MAX_BACKFILL_DAYS="${MAX_BACKFILL_DAYS:-14}"
AUTHOR="149891978+MarysaUzumaki@users.noreply.github.com"

if ! mkdir "$LOCKDIR" 2>/dev/null; then
    echo "$(date +%F\ %T) SKIP: другой запуск ещё выполняется" >> "$LOG"
    exit 0
fi
cd "$REPO" || { rmdir "$LOCKDIR"; exit 1; }

# Пуш с таймаутом и одним ретраем: зависший git push иначе стопорит весь прогон
push_safe() {
    local attempt
    for attempt in 1 2; do
        if git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=45 \
               -c http.postBuffer=524288000 push -q origin main 2>>"$LOG"; then
            return 0
        fi
        echo "$(date +%F\ %T) push не прошёл (попытка $attempt), повтор" >> "$LOG"
        sleep 10
    done
    return 1
}

TMP=$(mktemp -d /tmp/cc.XXXXXX) || exit 1
trap 'rm -rf "$TMP"; rmdir "$LOCKDIR" 2>/dev/null' EXIT

git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=45 fetch -q origin main 2>>"$LOG" || true
git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=45 pull --rebase --autostash -q origin main 2>>"$LOG" || true

TODAY=$(date +%Y-%m-%d)

# Дни к добору: окно в MAX_BACKFILL_DAYS+1 последних дней (включая сегодня).
# Не опираемся на дату последнего коммита — один свежий «служебный» коммит
# иначе замаскирует пропущенные дни. Полные дни отсеются счётчиком ниже.
DAYS=$(python3 - "$TODAY" "$MAX_BACKFILL_DAYS" <<'PY'
import sys, datetime as dt
today, cap = sys.argv[1], int(sys.argv[2])
t = dt.date.fromisoformat(today)
print("\n".join((t - dt.timedelta(days=k)).isoformat() for k in range(cap, -1, -1)))
PY
)

WORKED=0
# Даты всех коммитов читаем одним проходом: git --since/--until даёт заниженный
# счёт на не-монотонной по датам истории (после бэкфилла он обрезает обход).
git log --format=%cd --date=format:%Y-%m-%d > "$TMP/dates_all"

for day in $DAYS; do
    CNT=$(grep -cx "$day" "$TMP/dates_all" || true)
    CNT=${CNT:-0}
    NEED=$((TARGET - CNT))
    if [ "$NEED" -le 0 ]; then
        echo "$(date +%F\ %T) SKIP $day: уже $CNT коммитов" >> "$LOG"
        continue
    fi

    TOP=$(python3 -c "
import json
last = open('data/cookies.jsonl', encoding='utf-8').read().splitlines()[-1]
v = float(json.loads(last)['value'])
print(int(v * 1.05))
")

    python3 scripts/continue_cookies.py --count "$NEED" --from-file data/cookies.jsonl \
        --top "$TOP" --out "$TMP/c.jsonl" --msgs "$TMP/m.txt" >>"$LOG" 2>&1 || { echo "$(date +%F\ %T) ОШИБКА генератора $day" >> "$LOG"; continue; }

    python3 - "$day" "$NEED" "$TMP" "$TODAY" <<'PY'
import json, sys, datetime as dt
day, need, tmp, today = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
zone = dt.timezone(dt.timedelta(hours=5))
d = dt.datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=zone)
start = d.replace(hour=9, minute=0, second=0)
end = d.replace(hour=23, minute=30, second=0)
now = dt.datetime.now(zone)
if day == today and start < now:
    start = now + dt.timedelta(minutes=1)
if start >= end:
    start = d.replace(hour=23, minute=0); end = d.replace(hour=23, minute=58)
rows = [json.loads(l) for l in open(tmp + "/c.jsonl", encoding="utf-8").read().splitlines()]
rows.sort(key=lambda o: (o["value"], o["id"]))
base = int(rows[0]["id"])
for j, o in enumerate(rows):
    o["id"] = str(base + j)
open(tmp + "/c.jsonl", "w", encoding="utf-8").write("\n".join(json.dumps(o, ensure_ascii=False) for o in rows) + "\n")
open(tmp + "/m.txt", "w", encoding="utf-8").write("\n".join("Добавить печенье «" + o["name"] + "» (" + o["rarity"] + ")" for o in rows) + "\n")
step = (end - start).total_seconds() / max(1, need - 1)
open(tmp + "/dates.txt", "w").write("\n".join((start + dt.timedelta(seconds=step * i)).strftime("%Y-%m-%d %H:%M:%S +0500") for i in range(need)) + "\n")
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
        if [ $((j % 25)) -eq 0 ]; then push_safe || true; fi
    done < "$TMP/dates.txt"

    push_safe || true
    echo "$(date +%F\ %T) OK $day: +$NEED (было $CNT)" >> "$LOG"
    WORKED=$((WORKED + NEED))
done

[ "$WORKED" -eq 0 ] && echo "$(date +%F\ %T) SKIP: нечего добавлять" >> "$LOG"
exit 0