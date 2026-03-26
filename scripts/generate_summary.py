"""
Generate book summaries using OpenAI GPT-4.

Usage:
    export OPENAI_API_KEY=your_key
    python generate_summary.py
"""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
BOOK_LIST = Path(__file__).parent / "book_list.json"
OUTPUT_DIR = Path(__file__).parent / "output" / "summaries"

PROMPT_TEMPLATE = """\
你是一位專業的書籍摘要作家。請為以下書籍撰寫一份結構化摘要。

書名: {title}
作者: {author}

請嚴格按照以下 JSON 格式輸出（不要包含 markdown 代碼塊標記）：

{{
  "key_insights": [
    {{"title": "觀點標題", "content": "200字以內的詳細說明"}},
    ... (共 3-5 條)
  ],
  "chapters": [
    {{"title": "章節主題", "content": "300字以內的章節摘要"}},
    ... (共 4-6 個章節)
  ],
  "quotes": [
    "書中的經典語錄或核心金句",
    ... (共 5-8 條)
  ]
}}

要求：
- 語言：{language_instruction}
- 摘要需要忠實反映原書核心思想
- 金句要有啟發性和傳播力
- 每條觀點需要有具體的解釋，不要空洞
"""


def generate_summary(client: OpenAI, title: str, author: str, lang: str) -> dict:
    if lang == "zh-TW":
        lang_instruction = "使用繁體中文（台灣用語習慣）"
    else:
        lang_instruction = "Используйте русский язык"

    prompt = PROMPT_TEMPLATE.format(
        title=title,
        author=author,
        language_instruction=lang_instruction,
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4000,
    )

    content = response.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content[:-3]

    return json.loads(content)


def main():
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not set. Please set it in .env or environment.")
        sys.exit(1)

    client = OpenAI(api_key=OPENAI_API_KEY)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(BOOK_LIST, "r", encoding="utf-8") as f:
        books = json.load(f)

    for i, book in enumerate(books):
        print(f"\n[{i+1}/{len(books)}] Processing: {book['title_zh']} / {book['title_ru']}")

        for lang in ["zh-TW", "ru"]:
            title = book["title_zh"] if lang == "zh-TW" else book["title_ru"]
            author = book["author_zh"] if lang == "zh-TW" else book["author_ru"]
            out_file = OUTPUT_DIR / f"book_{i+1}_{lang}.json"

            if out_file.exists():
                print(f"  [{lang}] Already exists, skipping.")
                continue

            print(f"  [{lang}] Generating summary...")
            try:
                summary = generate_summary(client, title, author, lang)
                with open(out_file, "w", encoding="utf-8") as f:
                    json.dump(summary, f, ensure_ascii=False, indent=2)
                print(f"  [{lang}] Done -> {out_file.name}")
            except Exception as e:
                print(f"  [{lang}] Error: {e}")

    print("\nAll summaries generated!")


if __name__ == "__main__":
    main()
