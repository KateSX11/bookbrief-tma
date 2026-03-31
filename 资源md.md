好的，以下是完整的产品文档，直接复制即可：

---

# BookBrief 内容资源生产规范与架构文档

## 一、文档背景

### 1.1 项目概述

BookBrief 是一款基于 Telegram Mini App（TMA）的读书摘要产品，为用户提供书籍摘要的**阅读**与**聆听**两种消费方式。目标市场为台湾（繁体中文）和俄语区。

### 1.2 本文档的定位

BookBrief 的代码工程（TMA 前端 + 后端 API + Telegram Bot）与**内容资源生产**是两个独立的工作流：

- **TMA 项目**：负责产品功能、用户交互、支付、数据展示
- **内容资源项目**（本文档所描述）：负责书籍摘要文本、音频、封面等资源的生产、管理和输出

本文档详细定义了内容资源项目的文件结构、字段规范、生产流程和与 TMA 项目的对接方式，确保资源生产端产出的内容能被 TMA 项目无缝消费。

### 1.3 核心设计原则

**以语言/市场为维度，而非以书籍为维度。**

原因：
- 不同语言市场的书籍是**独立选品、独立生产**的，而非对同一本书做翻译
- 台湾市场和俄语市场的书单可能完全不同
- 每种语言的生产节奏独立，可能先上线一种语言，另一种慢慢来
- 将来如果某种语言交给另一个人/团队管理，直接拿走整个语言文件夹即可

### 1.4 资源消费端的产品设计（TMA 端）

为了帮助理解资源需要包含哪些内容，以下是 TMA 端的页面结构：

| 页面 | 消费的资源 |
|---|---|
| **首页** | 封面图、书名、作者、金句（tagline）、分类标签 |
| **书籍详情页** | 封面图、书名、作者、时长、金句列表（quotes）、章节标题列表 |
| **阅读页** | 单章文本正文（Markdown） |
| **聆听页** | 单章音频文件（MP3） |
| **我的页面** | 阅读进度（由 TMA 端自行记录，不依赖资源端） |

---

## 二、内容资源仓库结构

### 2.1 仓库全局结构

```
bookbrief-content/
├── zh/                              # 繁体中文市场（完全独立）
│   ├── catalog.json                 # 繁中书目索引
│   ├── 1001/                        # 单本书文件夹（ID 命名）
│   │   ├── meta.json                # 本书元数据
│   │   ├── cover.webp               # 封面图
│   │   ├── ch01.md                  # 第1章 文本
│   │   ├── ch01.mp3                 # 第1章 音频
│   │   ├── ch02.md                  # 第2章 文本
│   │   ├── ch02.mp3                 # 第2章 音频
│   │   ├── ch03.md
│   │   ├── ch03.mp3
│   │   ├── ch04.md
│   │   ├── ch04.mp3
│   │   ├── ch05.md
│   │   └── ch05.mp3
│   ├── 1002/
│   │   ├── meta.json
│   │   ├── cover.webp
│   │   ├── ch01.md
│   │   ├── ch01.mp3
│   │   └── ...
│   └── 1003/
│       └── ...
│
├── ru/                              # 俄语市场（完全独立）
│   ├── catalog.json                 # 俄语书目索引
│   ├── 1001/                        # 和 zh/1001 没有任何关系，可以是完全不同的书
│   │   ├── meta.json
│   │   ├── cover.webp
│   │   ├── ch01.md
│   │   ├── ch01.mp3
│   │   └── ...
│   └── 1002/
│       └── ...
│
├── scripts/                         # 生产辅助脚本（各语言共用）
│   ├── generate_summary.py          # 文本摘要生成（调用 Gemini API）
│   ├── generate_audio.py            # 音频生成（调用 TTS API）
│   ├── generate_cover.py            # 封面生成（调用图像生成 API）
│   ├── validate.py                  # 资源完整性校验
│   └── sync_to_tma.py              # 同步资源到 TMA 项目 / 云存储
│
├── templates/                       # 生产模板
│   ├── summary_prompt_zh.md         # 繁中摘要生成的 Prompt 模板
│   ├── summary_prompt_ru.md         # 俄语摘要生成的 Prompt 模板
│   └── meta_template.json           # meta.json 空模板
│
├── .env.example                     # 环境变量模板（API Key 等）
└── README.md                        # 本仓库使用说明
```

### 2.2 关键设计说明

**语言文件夹完全独立**：`zh/` 和 `ru/` 之间没有任何关联。它们各自维护自己的 ID 序列、自己的 catalog、自己的书目。`zh/1001` 可能是《原子習慣》，而 `ru/1001` 可能是《Думай медленно, решай быстро》——完全不同的书。

**每个语言文件夹是自包含的**：拿走 `zh/` 整个文件夹就是一个完整的繁中市场内容库，不依赖任何外部引用。

### 2.3 书籍 ID 命名规范

| 规则 | 说明 |
|---|---|
| **起始编号** | `1001` |
| **递增方式** | 顺序 +1（1001, 1002, 1003, ...） |
| **各语言独立编号** | `zh/1001` 和 `ru/1001` 是独立的，可以是不同的书 |
| **为什么从 1001** | 四位数天然是合法数字，不存在前导零的 JSON 解析问题，排序统一 |
| **为什么不用书名** | 书名含多语言字符、空格、特殊符号，在文件路径、API URL、数据库查询中都会造成麻烦 |

---

## 三、meta.json 字段规范

每本书的 `{lang}/{id}/meta.json` 包含该书的所有元数据。

### 3.1 完整字段定义

```json
{
  "id": "1001",
  "title": "原子習慣",
  "author": "詹姆斯·克利爾",
  "original_title": "Atomic Habits",
  "original_author": "James Clear",

  "category": "self-improvement",

  "tagline": "每天進步1%，一年後你會強大37倍",

  "quotes": [
    "你不會升到目標的高度，而是降到系統的水平。",
    "習慣是自我改善的複利。",
    "每一個行動都是你在為你想成為的人投票。"
  ],

  "chapters": [
    { "index": 1, "title": "為什麼微小的改變會帶來巨大的差異" },
    { "index": 2, "title": "習慣如何塑造你的身份認同" },
    { "index": 3, "title": "建立好習慣的四步驟法則" },
    { "index": 4, "title": "讓習慣變得不可抗拒" },
    { "index": 5, "title": "持續精進的秘密" }
  ],

  "time": 15,

  "is_featured": false,
  "is_hot": true,
  "is_free": true,
  "sort_order": 10,
  "status": "published",

  "created_at": "2026-03-20",
  "updated_at": "2026-03-25"
}
```

### 3.2 字段详细说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 书籍唯一标识，与文件夹名一致，如 `"1001"` |
| `title` | string | 是 | 该语言的书名 |
| `author` | string | 是 | 该语言的作者名 |
| `original_title` | string | 否 | 原书英文名（用于去重和跨语言参考） |
| `original_author` | string | 否 | 原作者英文名 |
| `category` | string | 是 | 主分类，枚举值见下方 |
| `tagline` | string | 是 | **一句话金句**——首页卡片展示，击中用户核心观点 |
| `quotes` | string[3] | 是 | **3 条经典语录**——详情页展示的书中名句 |
| `chapters` | array | 是 | 章节标题列表。`index` 对应文件名 `ch01.md` 中的编号 |
| `chapters[].index` | number | 是 | 章节序号（1, 2, 3...），对应 `ch01.md` / `ch01.mp3` |
| `chapters[].title` | string | 是 | 章节标题 |
| `time` | number | 是 | 预估消费时长（分钟） |
| `is_featured` | boolean | 是 | 是否出现在首页「今日推荐」区域 |
| `is_hot` | boolean | 是 | 是否出现在首页「热门精选」区域 |
| `is_free` | boolean | 是 | 是否免费。`false` 需要 Telegram Stars 解锁 |
| `sort_order` | number | 否 | 排序权重，数字越小越靠前。默认按 `created_at` 排序 |
| `status` | string | 是 | `draft` / `published` / `archived`。只有 `published` 会被同步到 TMA |
| `created_at` | string | 是 | 资源创建日期（YYYY-MM-DD） |
| `updated_at` | string | 是 | 最后更新日期（YYYY-MM-DD） |

**注意**：不需要 `lang` 字段，因为文件路径本身就说明了语言（`zh/1001/meta.json` 一定是繁中）。

### 3.3 category 枚举值

| 值 | 繁中显示 | 俄语显示 |
|---|---|---|
| `self-improvement` | 自我成長 | Саморазвитие |
| `business` | 商業理財 | Бизнес |
| `psychology` | 心理學 | Психология |
| `productivity` | 效率提升 | Продуктивность |
| `relationships` | 人際關係 | Отношения |
| `health` | 健康養生 | Здоровье |
| `technology` | 科技趨勢 | Технологии |
| `philosophy` | 哲學思考 | Философия |
| `finance` | 投資理財 | Финансы |
| `creativity` | 創意思維 | Креативность |

可以根据书单情况新增，建议初期控制在 10 个以内。

### 3.4 meta_template.json（空模板）

新增书籍时复制此模板填写：

```json
{
  "id": "",
  "title": "",
  "author": "",
  "original_title": "",
  "original_author": "",
  "category": "",
  "tagline": "",
  "quotes": ["", "", ""],
  "chapters": [
    { "index": 1, "title": "" },
    { "index": 2, "title": "" },
    { "index": 3, "title": "" },
    { "index": 4, "title": "" },
    { "index": 5, "title": "" }
  ],
  "time": 0,
  "is_featured": false,
  "is_hot": false,
  "is_free": true,
  "sort_order": 0,
  "status": "draft",
  "created_at": "",
  "updated_at": ""
}
```

---

## 四、catalog.json 字段规范

每种语言有自己独立的 `catalog.json`，位于对应语言文件夹根目录（如 `zh/catalog.json`）。

### 4.1 作用

- 快速了解该语言市场有多少本书、什么状态
- 同步脚本读取它来决定哪些书需要部署到 TMA
- 不包含正文内容，只包含索引级信息

### 4.2 完整结构

```json
{
  "version": "1.0",
  "lang": "zh",
  "updated_at": "2026-03-25",
  "total": 10,
  "published": 8,

  "books": [
    {
      "id": "1001",
      "title": "原子習慣",
      "category": "self-improvement",
      "status": "published",
      "is_free": true,
      "is_featured": false,
      "is_hot": true
    },
    {
      "id": "1002",
      "title": "快思慢想",
      "category": "psychology",
      "status": "published",
      "is_free": false,
      "is_featured": true,
      "is_hot": false
    },
    {
      "id": "1003",
      "title": "精實創業",
      "category": "business",
      "status": "draft",
      "is_free": true,
      "is_featured": false,
      "is_hot": false
    }
  ]
}
```

### 4.3 字段说明

| 字段 | 说明 |
|---|---|
| `version` | catalog 格式版本号，方便未来兼容升级 |
| `lang` | 该 catalog 对应的语言 |
| `updated_at` | catalog 最后更新时间 |
| `total` | 该语言的总书籍数（含 draft） |
| `published` | 已发布的书籍数 |
| `books[].id` | 对应 `{lang}/{id}/` 文件夹 |
| `books[].title` | 书名（从 meta.json 提取，方便快速浏览） |
| `books[].category` | 分类 |
| `books[].status` | `draft` / `published` / `archived` |
| `books[].is_free` | 是否免费 |
| `books[].is_featured` | 是否今日推荐 |
| `books[].is_hot` | 是否热门精选 |

**重要**：`catalog.json` 中的字段是 `meta.json` 的子集。应由脚本从各书的 `meta.json` 自动提取生成，避免手动维护两份数据导致不一致。

---

## 五、单章内容文件规范

### 5.1 文本文件（ch01.md ~ ch0N.md）

**为什么用 Markdown 而不是 JSON**：

- 章节正文是长篇内容，Markdown 天然适合阅读和编辑
- AI 生成后可以直接打开预览和修改，不需要处理 JSON 转义
- Git diff 清晰可读，改一段话一目了然
- TTS 脚本只需去掉 Markdown 标记即可获得纯文本
- JSON 中存放长文本需要处理 `\n` 和 `\"` 转义，编辑体验极差

**格式示例**：

```markdown
# 為什麼微小的改變會帶來巨大的差異

想像一架飛機從洛杉磯起飛，目的地是紐約。如果起飛後機頭僅僅偏轉了3.5度，
飛機最終會降落在華盛頓特區，而不是紐約。這就是微小改變的力量。

## 1% 法則

每天進步1%，一年後你會是原來的37倍。這不是勵志口號，而是數學事實。
複利的公式 1.01^365 = 37.78 告訴我們……

## 系統比目標重要

目標設定了方向，但系統決定了你是否真正進步。每一位奧運冠軍都有贏得金牌的目標，
區分他們的不是目標，而是日常訓練的系統。
```

**规范要求**：

| 规则 | 说明 |
|---|---|
| 文件编码 | UTF-8（无 BOM） |
| 文件命名 | `ch01.md`, `ch02.md` ... 两位数字，零填充 |
| 一级标题 | `# 章节标题`，与 `meta.json` 中 `chapters[].title` 一致 |
| 内容长度 | 每章 800-1500 字（繁中）/ 700-1200 词（俄语），对应 2-4 分钟阅读 |
| 格式要素 | 可包含二级标题 `##`、粗体 `**`、列表 `-`、引用 `>` |
| 禁止使用 | 图片 `![]()`、HTML 标签、外部链接 |

### 5.2 音频文件（ch01.mp3 ~ ch0N.mp3）

| 规则 | 说明 |
|---|---|
| 格式 | MP3, CBR 128kbps, 44100Hz, Mono |
| 命名 | 与文本文件对应：`ch01.mp3` 对应 `ch01.md` |
| 时长 | 每章 4-8 分钟，整本书 20-40 分钟 |
| 开头/结尾 | 不加片头片尾音乐，纯语音内容 |
| 音量标准 | 响度标准化至 -16 LUFS（避免各章音量不一致） |
| 静音处理 | 文件首尾保留 0.5 秒静音（避免播放器切换时截断） |

### 5.3 封面图（cover.webp）

每种语言各自独立的封面，位于各语言的书籍文件夹内。

| 规则 | 说明 |
|---|---|
| 格式 | WebP（相比 JPG/PNG 体积小 25-35%，Telegram 客户端完全支持） |
| 尺寸 | **600×900px**（2:3 比例，与常见书籍封面比例一致） |
| 文件大小 | 控制在 **100KB 以内** |
| 画质 | WebP quality 80-85 |
| 命名 | 固定为 `cover.webp` |
| 注意事项 | WebP 不支持 CMYK 色彩模式，生成时确保为 RGB |

---

## 六、内容生产流程

### 6.1 流程总览

```
选书 → 生成文本摘要 → 审校 → 生成音频 → 生成封面 → 填写 meta.json → 校验 → 发布
```

各步骤对应的工具和产出：

| 步骤 | 工具 / API | 输入 | 输出 |
|---|---|---|---|
| 1. 选书 | 人工 | 书单 | 空的 `{lang}/{id}/` 文件夹 + `meta.json`（draft 状态） |
| 2. 生成文本摘要 | Gemini API | 原书内容/大纲 + Prompt 模板 | `ch01.md` ~ `ch0N.md` |
| 3. 审校 | 人工 + AI 辅助 | 生成的 MD 文件 | 修改后的 MD 文件 |
| 4. 生成音频 | TTS API | 审校后的 MD 文本 | `ch01.mp3` ~ `ch0N.mp3` |
| 5. 生成封面 | nanobanana2 / 图像生成 API | 书名、风格描述 | `cover.webp` |
| 6. 填写 meta.json | 人工 / 脚本辅助 | 上面生成的所有内容 | 完整的 `meta.json` |
| 7. 校验 | `validate.py` 脚本 | 整个书籍文件夹 | 通过 / 报错清单 |
| 8. 发布 | 将 status 改为 `published`，运行同步脚本 | — | 资源部署到线上 |

### 6.2 文本摘要生成

**工具**：Google Gemini API

**Prompt 策略**：每本书生成 5-6 章摘要，每章独立生成一个 MD 文件。

Prompt 模板参考（存放于 `templates/summary_prompt_zh.md`）：

```markdown
你是一位專業的書籍摘要作家。請為以下書籍撰寫第 {chapter_index} 章的摘要。

書名：{book_title}
作者：{book_author}
本章主題：{chapter_topic}

要求：
1. 使用繁體中文（台灣用語習慣）
2. 字數控制在 800-1500 字
3. 用 Markdown 格式，以 # 章節標題 開頭
4. 語氣親切但有深度，像是一位朋友在分享讀書心得
5. 包含具體的例子或故事來說明觀點
6. 可以使用 ## 小標題來組織內容
7. 不要使用圖片、HTML 或外部連結
```

**生产脚本**：`scripts/generate_summary.py`

```python
# 用法：python generate_summary.py --lang zh --book 1001 --chapter 1
# 或一次性全部生成：python generate_summary.py --lang zh --book 1001 --all
#
# 流程：
# 1. 读取 {lang}/{id}/meta.json 获取书名、作者、章节标题
# 2. 加载 templates/summary_prompt_{lang}.md 模板
# 3. 调用 Gemini API 生成文本
# 4. 写入 {lang}/{id}/ch{index}.md
```

### 6.3 音频生成

**工具选型**：

| 工具 | 适用场景 | 质量 | 成本 |
|---|---|---|---|
| Edge TTS | 快速原型、测试 | 中等 | 免费 |
| Microsoft Azure TTS | 正式发布（繁中） | 高 | ~$16/百万字符 |
| Yandex SpeechKit | 正式发布（俄语） | 高 | ~$1.2/百万字符 |
| VOAI TTS | 备选方案 | 高 | 视套餐 |

**音色选择建议**：

| 语言 | 推荐音色 | 说明 |
|---|---|---|
| 繁中 | `zh-TW-HsiaoChenNeural`（女声）或 `zh-TW-YunJheNeural`（男声） | 台湾口音，自然流畅 |
| 俄语 | `ru-RU-SvetlanaNeural`（女声）或 `ru-RU-DmitryNeural`（男声） | 标准发音，语速适中 |

**生产脚本**：`scripts/generate_audio.py`

```python
# 用法：python generate_audio.py --lang zh --book 1001 --chapter 1
# 或一次性：python generate_audio.py --lang zh --book 1001 --all
#
# 流程：
# 1. 读取 {lang}/{id}/ch{index}.md
# 2. 去除 Markdown 标记，提取纯文本
# 3. 调用 TTS API 生成音频
# 4. 后处理：响度标准化、首尾加静音
# 5. 写入 {lang}/{id}/ch{index}.mp3
```

**音频后处理命令参考**（使用 ffmpeg）：

```bash
# 响度标准化到 -16 LUFS
ffmpeg -i input.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -ac 1 -b:a 128k output.mp3
```

### 6.4 封面生成

**工具**：nanobanana2（或其他图像生成 API）

**风格要求**：
- 统一的视觉风格（建议：扁平插画风 / 渐变抽象风）
- 不同语言的封面可以有不同的设计/配色
- 色调鲜明，在小卡片尺寸下仍有辨识度

**后处理**（原图转 WebP）：

```bash
# 使用 ffmpeg
ffmpeg -i raw_cover.png -vf scale=600:900 -quality 82 cover.webp

# 或使用 cwebp
cwebp -q 82 -resize 600 900 raw_cover.png -o cover.webp
```

---

## 七、资源校验规范

### 7.1 校验脚本用法

```bash
# 校验单本书
python scripts/validate.py --lang zh --book 1001

# 校验某语言的所有书
python scripts/validate.py --lang zh --all

# 重新构建 catalog.json（从各 meta.json 自动生成）
python scripts/validate.py --lang zh --rebuild-catalog
```

### 7.2 校验清单

```
对指定的 {lang}/{id}/ 文件夹：

✅ meta.json 存在且 JSON 格式合法
✅ meta.json 所有必填字段存在且类型正确
✅ meta.json 的 id 与文件夹名一致
✅ quotes 数量为 3 条
✅ chapters 数量 >= 1
✅ cover.webp 存在
✅ cover.webp 尺寸为 600×900（允许 ±10px 误差）
✅ cover.webp 文件大小 < 150KB
✅ 每章的 .md 文件存在且非空
✅ 每章的 .md 文件首行为 # 标题
✅ 每章的 .md 文件编码为 UTF-8
✅ 每章的 .md 文件字数在 500-2000 范围内（繁中）/ 400-1500 词（俄语）
✅ 每章的 .mp3 文件存在且时长 > 30 秒
✅ .md 文件数量与 .mp3 文件数量一致
✅ 文件数量与 meta.json 中 chapters 数量一致

对 catalog.json：
✅ catalog 中每本 published 的书在文件夹中存在
✅ 文件夹中每本 published 的书在 catalog 中有记录
✅ catalog 中的字段与 meta.json 一致（无数据不同步）
```

### 7.3 校验输出示例

```
🔍 Validating zh/1001 (原子習慣)...
  ✅ meta.json: valid
  ✅ cover.webp: 600x900, 87KB
  ✅ 5 chapters: all .md and .mp3 present
  ✅ All checks passed

🔍 Validating zh/1002 (快思慢想)...
  ✅ meta.json: valid
  ✅ cover.webp: 600x900, 92KB
  ❌ ch03.mp3 missing
  ⚠️ ch05.md: 438 chars (below minimum 500)

📊 Summary: 2 books checked, 1 error, 1 warning
```

---

## 八、与 TMA 项目的对接方式

### 8.1 对接架构

```
┌──────────────────┐              ┌──────────────────┐
│  内容资源仓库     │              │  TMA 项目         │
│  (bookbrief-     │    sync      │  (bookbrief-tma) │
│   content)       │  ─────────>  │                  │
│                  │              │  backend/        │
│  zh/             │              │    media/        │
│    catalog.json  │              │      zh/         │
│    1001/         │              │        1001/     │
│    1002/         │              │      ru/         │
│  ru/             │              │        1001/     │
│    catalog.json  │              │    database      │
│    1001/         │              │                  │
└──────────────────┘              └──────────────────┘
```

### 8.2 同步脚本职责（sync_to_tma.py）

```bash
# 同步繁中内容到 TMA
python scripts/sync_to_tma.py --lang zh

# 同步俄语内容到 TMA
python scripts/sync_to_tma.py --lang ru

# 只同步单本书
python scripts/sync_to_tma.py --lang zh --book 1001
```

同步脚本的具体流程：

1. **读取** `{lang}/catalog.json`，筛选 `status === "published"` 的书籍
2. **对每本书**：
   - 读取 `{lang}/{id}/meta.json`
   - 复制 `cover.webp` → TMA 的 `backend/media/{lang}/{id}/cover.webp`
   - 复制 `ch*.mp3` → TMA 的 `backend/media/{lang}/{id}/ch*.mp3`
   - 读取 `ch*.md`，组装成结构化数据写入数据库
3. **更新数据库**：将 `meta.json` 的字段写入 books 表

### 8.3 TMA 端的资源 URL 映射

| 资源 | URL 路径 |
|---|---|
| 繁中 1001 封面 | `/media/zh/1001/cover.webp` |
| 繁中 1001 第1章音频 | `/media/zh/1001/ch01.mp3` |
| 俄语 1001 封面 | `/media/ru/1001/cover.webp` |
| 俄语 1001 第3章音频 | `/media/ru/1001/ch03.mp3` |

### 8.4 未来扩展：云存储

当书籍量增长或音频总体积超过 2GB 时，建议将 media 迁移至云存储：

| 方案 | 优势 | 月成本（10GB） |
|---|---|---|
| Cloudflare R2 | 出站流量免费 | ~$0.15 |
| AWS S3 | 生态完善 | ~$0.23 + 流量费 |
| Backblaze B2 | 最便宜 | ~$0.06 |

迁移时只需修改同步脚本的目标地址，并在 TMA 后端将 media URL 从本地路径改为 CDN 地址，前端代码无需更改。

---

## 九、生产工作流（操作手册）

### 9.1 新增一本书的标准流程

```bash
# 第1步：确定 ID（查看当前最大 ID + 1）
ls zh/
# 假设当前最大是 1005，新书用 1006

# 第2步：创建书籍目录
mkdir zh/1006

# 第3步：从模板创建 meta.json
cp templates/meta_template.json zh/1006/meta.json
# 编辑填入基本信息：id、title、author、category、chapters 标题等
# 此时 status 设为 "draft"

# 第4步：生成文本摘要（每章分别生成或一次性生成）
python scripts/generate_summary.py --lang zh --book 1006 --all

# 第5步：人工审校
# 打开 zh/1006/ch01.md ~ ch05.md，检查内容质量
# 修正错误、调整语气、补充例子

# 第6步：生成音频
python scripts/generate_audio.py --lang zh --book 1006 --all

# 第7步：生成封面
python scripts/generate_cover.py --lang zh --book 1006

# 第8步：完善 meta.json
# 补充 tagline、quotes、time 等字段
# 将 status 改为 "published"

# 第9步：校验
python scripts/validate.py --lang zh --book 1006

# 第10步：更新 catalog.json
python scripts/validate.py --lang zh --rebuild-catalog

# 第11步：同步到 TMA
python scripts/sync_to_tma.py --lang zh --book 1006
```

### 9.2 批量操作

```bash
# 校验某语言所有书籍
python scripts/validate.py --lang zh --all

# 重新构建 catalog.json
python scripts/validate.py --lang zh --rebuild-catalog

# 同步所有已发布书籍到 TMA
python scripts/sync_to_tma.py --lang zh --all
```

---

## 十、注意事项与约束

### 10.1 多语言生产顺序

建议先完成一种语言的全部内容再开始另一种语言，而非逐本双语同时生产。原因：
- 繁中和俄语的审校标准不同，混着做容易分心
- 可以先上线单语言版本（如先上台湾繁中），快速验证市场
- 两种语言的书单本身可能不同，没必要强行同步进度

### 10.2 内容质量红线

| 规则 | 说明 |
|---|---|
| AI 生成必须人工审校 | 不允许未经审校直接发布 |
| 不抄原文大段落 | 摘要是提炼和再创作，不是复制粘贴 |
| 金句必须准确 | tagline 和 quotes 中的引用需核实出处 |
| 音频不能有明显机器感 | 选择自然度高的音色，测试后再批量生成 |

### 10.3 文件大小预估（单语言）

| 资源类型 | 单本书 | 10 本书 | 100 本书 |
|---|---|---|---|
| 文本（5章 MD） | ~30KB | ~300KB | ~3MB |
| 音频（5章 MP3, 128kbps, ~30min） | ~28MB | ~280MB | ~2.8GB |
| 封面（WebP） | ~80KB | ~800KB | ~8MB |
| **单语言合计** | ~28MB | ~280MB | ~2.8GB |

---

以上就是完整的文档，你可以直接复制保存。