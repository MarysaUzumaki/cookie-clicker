#!/usr/bin/env python3
"""Сборка бандла src/data/cookies.js из data/cookies.jsonl.

Формат бандла: window.COOKIE_ENCYCLOPEDIA = [...]; (обычный script, без modules).
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "data" / "cookies.jsonl"
DST = REPO / "src" / "data" / "cookies.js"


def main():
    entries = []
    with SRC.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            entries.append(obj)

    body = "window.COOKIE_ENCYCLOPEDIA = " + json.dumps(entries, ensure_ascii=False) + ";\n"
    DST.write_text(body, encoding="utf-8")
    print(f"Бандл собран: {len(entries)} печений -> {DST}")


if __name__ == "__main__":
    sys.exit(main())