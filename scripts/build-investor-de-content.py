#!/usr/bin/env python3
"""Regenerate investor-de markdown + de.json patch from Desktop biovera-pitch PDFs."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    print("pip install pypdf", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PITCH_DIR = Path.home() / "Desktop" / "biovera-pitch"
OUT = ROOT / "web" / "content" / "investor-de"
PATCH_PATH = ROOT / "scripts" / "investor-de-locale-patch.json"
DE_JSON = ROOT / "web" / "locales" / "de.json"


def extract_pdf(path: Path) -> list[str]:
    return [(p.extract_text() or "").strip() for p in PdfReader(str(path)).pages]


def clean_page(text: str) -> str:
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if re.match(r"^Bio Vera — .+ \| Seite \d+ von \d+$", line):
            continue
        if re.match(r"^\d{2} / \d{2}$", line):
            continue
        if line in tuple(f"{i}." for i in range(1, 12)):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def pages_to_md(title: str, pages: list[str], skip_first: int = 0) -> str:
    parts = [f"# {title}\n"]
    for i, raw in enumerate(pages[skip_first:], start=skip_first + 1):
        body = clean_page(raw)
        if not body or body.lower().startswith("inhaltsverzeichnis"):
            continue
        parts.append(f"\n---\n\n## Seite {i}\n\n{body}\n")
    return "\n".join(parts)


def main() -> None:
    proj = extract_pdf(PITCH_DIR / "BioVera_Projektbeschreibung_2026.pdf")
    biz = extract_pdf(PITCH_DIR / "BioVera_Businessplan_2026.pdf")
    pitch = extract_pdf(PITCH_DIR / "BioVera_PitchDeck_2026_v4.pdf")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "de-projektbeschreibung-2026.md").write_text(
        pages_to_md("Bio Vera — Projektbeschreibung 2026", proj, 1), encoding="utf-8"
    )
    (OUT / "de-businessplan-2026.md").write_text(
        pages_to_md("Bio Vera — Businessplan 2026", biz, 1), encoding="utf-8"
    )
    (OUT / "de-pitch-deck-2026.md").write_text(
        pages_to_md("Bio Vera — Pitch Deck 2026", pitch, 0), encoding="utf-8"
    )

    if PATCH_PATH.exists():
        patch = json.loads(PATCH_PATH.read_text(encoding="utf-8"))
        de = json.loads(DE_JSON.read_text(encoding="utf-8"))

        def deep_merge(base: dict, upd: dict) -> None:
            for k, v in upd.items():
                if k in base and isinstance(base[k], dict) and isinstance(v, dict):
                    deep_merge(base[k], v)
                else:
                    base[k] = v

        deep_merge(de, patch)
        DE_JSON.write_text(json.dumps(de, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("Generated:", OUT)
    print("Projektbeschreibung pages:", len(proj), "Businessplan:", len(biz), "Pitch:", len(pitch))


if __name__ == "__main__":
    main()
