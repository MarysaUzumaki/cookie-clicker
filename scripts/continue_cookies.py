#!/usr/bin/env python3
"""Продолжение энциклопедии после уже закоммиченных строк.

Читает data/cookies.jsonl, берёт последнее значение value как точку опоры
и дописывает --count записей детерминированно (зависят только от индекса).
Имена не повторяют уже занятые комбинации. Вывод: --out (JSONL) + --msgs.

Масштаб value: от последнего значения до --top (по умолчанию 1e24).
"""
import argparse
import json
import random
import sys
from pathlib import Path

from generate_cookies import (ADJECTIVES, NOUNS, RARITIES, RARITY_WEIGHTS,
                              RARITY_MULT, FLAVOR_TEMPLATES, FILLERS, BONUS_PER_COOKIE)


def pick_rarity(rng):
    return rng.choices(RARITIES, weights=RARITY_WEIGHTS, k=1)[0]


def flavor(rng):
    t = rng.choice(FLAVOR_TEMPLATES)
    return t.replace("{z}", rng.choice(FILLERS))


def unused_names(count, taken, seed=43):
    adi = list(dict.fromkeys(ADJECTIVES))
    nouns = list(dict.fromkeys(NOUNS))
    combos = [f"{a} {n}" for a in adi for n in nouns if f"{a} {n}" not in taken]
    if len(combos) < count:
        raise ValueError(f"Не хватает свободных имён: {len(combos)} < {count}")
    rng = random.Random(seed)
    rng.shuffle(combos)
    return combos[:count]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, required=True)
    ap.add_argument("--from-file", type=Path, required=True)
    ap.add_argument("--top", type=float, default=1e24)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--msgs", type=Path, required=True)
    args = ap.parse_args()

    existing = []
    with args.from_file.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                existing.append(json.loads(line))

    taken_names = {e["name"] for e in existing}
    v0 = float(existing[-1]["value"])
    start_idx = len(existing)  # следующий index (0-based), id = idx+1
    growth = (args.top / v0) ** (1.0 / args.count)

    names = unused_names(args.count, taken_names)
    lines = []
    msgs = []
    for j in range(args.count):
        idx = start_idx + j
        rng = random.Random(1000 + idx)  # тот же генератор, что и в начале
        rarity = pick_rarity(rng)
        value = int(v0 * (growth ** j) * RARITY_MULT[rarity] * rng.uniform(0.9, 1.15))
        name = names[j]
        entry = {
            "id": str(idx + 1),
            "name": name,
            "rarity": rarity,
            "value": value,
            "bonus": round(BONUS_PER_COOKIE, 3),
            "flavor": flavor(rng),
        }
        lines.append(json.dumps(entry, ensure_ascii=False))
        msgs.append(f"Добавить печенье «{name}» ({rarity})")

    args.out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    args.msgs.write_text("\n".join(msgs) + "\n", encoding="utf-8")
    print(f"Продолжение готово: {len(lines)} записей (id {start_idx+1}..{start_idx+len(lines)})",
          file=sys.stderr)


if __name__ == "__main__":
    main()