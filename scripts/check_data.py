#!/usr/bin/env python3
"""Проверка data/cookies.jsonl: валидный JSON, обязательные поля, корректные типы,
уникальные id, монотонно растущие value (с допуском на множители редкости)."""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PATH = REPO / "data" / "cookies.jsonl"
REQUIRED = {"id", "name", "rarity", "value", "bonus", "flavor"}
KNOWN_RARITIES = {"Обычное", "Необычное", "Редкое", "Эпическое", "Легендарное", "Мифическое"}

def main():
    errors = []
    count = 0
    ids = set()

    def check(cond, msg, line_no=None):
        if not cond:
            errors.append(f"строка {line_no}: {msg}")

    with PATH.open(encoding="utf-8") as fh:
        for line_no, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            count += 1
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                check(False, f"не JSON: {e}")
                continue
            check(isinstance(obj, dict), "не объект")
            if not isinstance(obj, dict):
                continue
            missing = REQUIRED - set(obj)
            check(not missing, f"нет полей: {sorted(missing)}")
            check(obj.get("id") not in ids, f"дубликат id {obj.get('id')!r}")
            ids.add(obj.get("id"))
            check(obj.get("rarity") in KNOWN_RARITIES, f"неизвестная редкость {obj.get('rarity')!r}")
            try:
                value = float(obj.get("value"))
                check(value > 0, f"value не положительное: {value}")
                bonus = float(obj.get("bonus"))
                check(bonus >= 0, f"bonus < 0: {bonus}")
            except (TypeError, ValueError) as e:
                check(False, f"числовое поле плохое: {e}")

    check(count > 0, "файл пуст")
    check(len(ids) == count, "id не уникальны")

    check(count > 0, "файл пуст")
    check(len(ids) == count, "id не уникальны")

    if errors:
        print(f"ОШИБКИ ({len(errors)}):")
        for e in errors[:50]:
            print(" -", e)
        sys.exit(1)
    print(f"OK: {count} записей, всё валидно ({PATH.name})")


if __name__ == "__main__":
    main()