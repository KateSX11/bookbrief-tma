"""
Generate audio files from book summaries using Edge TTS (free).

Usage:
    python generate_audio.py

Voices used:
    zh-TW: zh-TW-HsiaoChenNeural (female)
    ru:    ru-RU-SvetlanaNeural   (female)
"""

import asyncio
import json
from pathlib import Path

import edge_tts

SUMMARIES_DIR = Path(__file__).parent / "output" / "summaries"
AUDIO_DIR = Path(__file__).resolve().parent.parent / "backend" / "media" / "audio"

VOICES = {
    "zh-TW": "zh-TW-HsiaoChenNeural",
    "ru": "ru-RU-SvetlanaNeural",
}


def summary_to_text(summary: dict, lang: str) -> str:
    """Convert structured summary JSON to a natural readable script."""
    parts = []

    if lang == "zh-TW":
        if summary.get("key_insights"):
            parts.append("以下是本書的核心觀點。")
            for item in summary["key_insights"]:
                parts.append(f"{item['title']}。{item['content']}")

        if summary.get("chapters"):
            parts.append("接下來是各章節摘要。")
            for ch in summary["chapters"]:
                parts.append(f"{ch['title']}。{ch['content']}")

        if summary.get("quotes"):
            parts.append("最後，分享幾句書中的經典語錄。")
            for q in summary["quotes"]:
                parts.append(q)
    else:
        if summary.get("key_insights"):
            parts.append("Вот ключевые идеи этой книги.")
            for item in summary["key_insights"]:
                parts.append(f"{item['title']}. {item['content']}")

        if summary.get("chapters"):
            parts.append("Далее краткое содержание глав.")
            for ch in summary["chapters"]:
                parts.append(f"{ch['title']}. {ch['content']}")

        if summary.get("quotes"):
            parts.append("И напоследок несколько цитат из книги.")
            for q in summary["quotes"]:
                parts.append(q)

    return "\n\n".join(parts)


async def generate_audio(text: str, voice: str, output_path: Path):
    communicate = edge_tts.Communicate(text, voice, rate="-5%")
    await communicate.save(str(output_path))


async def main():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    summary_files = sorted(SUMMARIES_DIR.glob("book_*_*.json"))
    if not summary_files:
        print("No summary files found. Run generate_summary.py first.")
        return

    for sf in summary_files:
        name = sf.stem  # e.g. book_1_zh-TW
        parts = name.rsplit("_", 1)
        lang = parts[-1]
        book_id = parts[0]

        if lang not in VOICES:
            continue

        audio_file = AUDIO_DIR / f"{name}.mp3"
        if audio_file.exists():
            print(f"[{name}] Already exists, skipping.")
            continue

        print(f"[{name}] Generating audio...")
        with open(sf, "r", encoding="utf-8") as f:
            summary = json.load(f)

        text = summary_to_text(summary, lang)
        await generate_audio(text, VOICES[lang], audio_file)
        print(f"[{name}] Done -> {audio_file.name}")

    print("\nAll audio files generated!")


if __name__ == "__main__":
    asyncio.run(main())
