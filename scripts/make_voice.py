"""Cantonese original-IP voice lines via edge-tts (zh-HK)."""

from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts

DST = Path(__file__).resolve().parents[1] / "public" / "assets" / "sfx"

JOBS = [
    (
        "vo-title.mp3",
        "zh-HK-HiuGaaiNeural",
        "崖邊一擊！開打啦！",
    ),
    (
        "taunt-bun.mp3",
        "zh-HK-WanLungNeural",
        "唔打到你飛落山就唔叫包子！",
    ),
    (
        "taunt-mochi.mp3",
        "zh-HK-HiuMaanNeural",
        "唔打到你飛落山就唔叫糯米！",
    ),
    (
        "taunt-bean.mp3",
        "zh-HK-HiuGaaiNeural",
        "唔打到你飛落山就唔叫豆豆！",
    ),
    (
        "vo-ko.mp3",
        "zh-HK-WanLungNeural",
        "飛出去啦！",
    ),
    (
        "vo-select.mp3",
        "zh-HK-HiuGaaiNeural",
        "揀角色，準備崖邊一擊！",
    ),
]


async def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for name, voice, text in JOBS:
        dest = DST / name
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(dest))
        print(f"wrote {dest} ({dest.stat().st_size} bytes) [{voice}] {text}")


if __name__ == "__main__":
    asyncio.run(main())
