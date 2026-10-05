#!/bin/bash
# Обновляет эту копию репозитория из GitHub.
# Канонические коммиты делает автобот в ~/cc-daily, здесь — только просмотр.
cd "$(dirname "$0")" || exit 1
git pull --rebase origin main
echo
echo "Коммитов: $(git rev-list --count HEAD)"
echo "Последний: $(git log -1 --format='%ad %s' --date=iso)"
echo
echo "Нажмите Enter, чтобы закрыть окно."
read -r