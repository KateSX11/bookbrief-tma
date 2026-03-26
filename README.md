# BookBrief TMA

A Telegram Mini App for reading and listening to book summaries, targeting Traditional Chinese (Taiwan) and Russian-speaking markets.

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose (for deployment)

### Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Bot:**
```bash
cd bot
pip install -r requirements.txt
python main.py
```

### Content Generation

```bash
cd scripts
pip install -r requirements.txt

# Generate book summaries (requires OPENAI_API_KEY)
python generate_summary.py

# Generate audio files (uses free Edge TTS)
python generate_audio.py

# Import data into database
python seed_books.py
```

### Docker Deployment

```bash
cp .env.example .env
# Edit .env with your tokens
docker compose up -d
```

## Project Structure

```
├── frontend/     React + Vite + TailwindCSS TMA frontend
├── backend/      FastAPI + SQLite backend API
├── bot/          Telegram Bot (opens Mini App)
├── scripts/      Content generation pipeline
└── docker-compose.yml
```
