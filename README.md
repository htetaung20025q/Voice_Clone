# Voice Studio 🎙️
> **Turn your text into natural-sounding AI voice.**

A production-grade, full-stack Text-to-Speech (TTS) web application powered by **Google Gemini TTS API** and **FastAPI**, designed with modern **UI/UX Pro Max** design principles and built with **React**, **TypeScript**, and **Tailwind CSS**.

---

## 🌟 Features

- **Gemini Neural Voices**: Real-time speech synthesis with official Google Gemini prebuilt voices:
  - 👩 **Kore** *(Firm & Confident)*
  - 👨 **Puck** *(Upbeat & Engaging)*
  - 👨 **Charon** *(Informative & Deep)*
  - 👨 **Fenrir** *(Excitable & Dynamic)*
  - 👩 **Aoede** *(Breezy & Melodic)*
  - 🎙️ **Zephyr**, **Leda**, and **Orus**
- **Expressive Speaking Styles**: Direct narration tones on the fly:
  - `Natural`, `Friendly`, `Professional`, `Calm`, `Energetic`, `Storytelling`
- **UI/UX Pro Max Design**:
  - Dark mode studio aesthetic with Inter typography and rich contrast.
  - Large accessible text editor with live `0 / 5000` character counter and quick sample presets.
  - Interactive HTML5 waveform visualization with scrubbing seekbar, volume control, and lossless 24kHz WAV downloads.
  - In-session take history for instant replays.
- **Zero API Key Exposure**: Secure FastAPI server-side mediation with CORS protection, environment isolation, and graceful development fallback.
- **Complete REST API**: Endpoints for TTS synthesis, voice discovery, style discovery, and health checks with automatic OpenAPI Swagger documentation.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────────┐
                    │        Frontend         │
                    │ React + TypeScript + TW │
                    │   (Vite @ port 5173)    │
                    └────────────┬────────────┘
                                 │
                                 │ REST API (POST /api/tts)
                                 ▼
                    ┌─────────────────────────┐
                    │     FastAPI Backend     │
                    │      (Python 3.14)      │
                    │   (Uvicorn @ port 8000) │
                    └────────────┬────────────┘
                                 │
                                 │ Google GenAI SDK (Server-Only)
                                 ▼
                    ┌─────────────────────────┐
                    │    Google Gemini TTS    │
                    │  (Audio Modality V2/V2.5)│
                    └────────────┬────────────┘
                                 │
                                 ▼
                         Generated Audio
                      (16-bit 24kHz RIFF WAV)
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Studio Audio Player   │
                    │   + Lossless Download   │
                    └─────────────────────────┘
```

---

## 📁 Project Structure

```text
Voice_Clone/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application, CORS & middlewares
│   │   ├── config.py            # Settings, voice metadata & style definitions
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── tts.py           # /api/tts, /api/voices, /api/styles, /api/health
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── gemini_tts.py    # Google GenAI TTS client & WAV converter
│   │   └── schemas/
│   │       ├── __init__.py
│   │       └── tts.py           # Pydantic request & response validation
│   ├── tests/
│   │   └── test_tts.py          # Pytest backend test suite (9 tests)
│   ├── requirements.txt         # FastAPI, Pydantic, google-genai
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Brand header, server status & navigation
│   │   │   ├── Hero.tsx         # Hero section, CTAs & preview mockup
│   │   │   ├── TextEditor.tsx   # 5,000-char editor with presets & shortcuts
│   │   │   ├── VoiceSelector.tsx# Gemini voice persona selector
│   │   │   ├── StyleSelector.tsx# Speaking style selector
│   │   │   ├── GenerateButton.tsx# 4-state action button (idle/loading/success/error)
│   │   │   └── AudioPlayer.tsx  # Waveform simulator, scrubbing, volume & download
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Landing page (Features, How it works, Use cases)
│   │   │   ├── Studio.tsx       # Primary TTS Studio workspace
│   │   │   ├── About.tsx        # Architecture, security & future roadmap
│   │   │   └── Docs.tsx         # Interactive REST API documentation
│   │   ├── services/
│   │   │   └── api.ts           # Centralized TypeScript API client
│   │   ├── index.css            # UI/UX Pro Max tokens, animations & styling
│   │   ├── App.tsx              # Routing & health polling
│   │   └── main.tsx             # Entry point
│   ├── tailwind.config.js       # Tailwind palette & typography
│   ├── package.json
│   └── tsconfig.json
│
├── start.py                     # 1-click concurrent server launcher
├── .env.example                 # Root environment template
└── README.md                    # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (Python 3.14 supported)
- **Node.js 18+** & **npm**

---

### 2. Backend Setup

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Configure your Gemini API key (Optional for local mock mode, required for live Gemini audio)
cp backend/.env.example backend/.env
# Edit backend/.env and set your GEMINI_API_KEY
```

> **Note on API Keys**: You can obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey). If no key is set, the server operates in a pleasant mock fallback mode so you can develop and test offline.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

---

### 4. Running Locally

#### Option A: 1-Click Startup (Recommended)
Run both backend and frontend concurrently with one command from the project root:
```bash
python3 start.py
```

#### Option B: Running Individually

**Terminal 1 — Backend:**
```bash
source venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

### 5. Accessing the Application

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Running Automated Tests

```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests/test_tts.py
```

To test the frontend production build:
```bash
cd frontend && npm run build
```

---

## 📡 API Reference

### `POST /api/tts`
Convert text into natural-sounding speech audio.

**Request Body:**
```json
{
  "text": "Hello, welcome to Voice Studio. Turn your text into natural-sounding AI voice.",
  "voice": "Kore",
  "style": "friendly",
  "speed": 1.0
}
```

**Response:**
Returns `audio/wav` binary stream with headers:
- `X-Audio-Duration`: Synthesized audio length in seconds
- `X-Audio-Latency-Ms`: Synthesis inference time in milliseconds
- `X-Audio-Voice`: Prebuilt voice used (e.g. `Kore`)
- `X-Audio-Style`: Applied style directive (e.g. `friendly`)

### `GET /api/voices`
Returns list of supported Gemini prebuilt voices with persona and gender tags.

### `GET /api/styles`
Returns list of available speaking styles and prompt instructions.

### `GET /api/health`
Returns backend health and Gemini API configuration status.

---

## 🔒 Security & Best Practices

1. **Server-Side API Key Isolation**: The Gemini API key is strictly stored on the FastAPI backend and never passed to the React frontend.
2. **CORS Restrictions**: Configured with environment-based allowed origins to prevent unauthorized cross-origin requests in production.
3. **Validation & Rate Safety**: Character limits (1 to 5,000 characters) and Pydantic schema validation protect backend compute from malformed requests.

---

## 📄 License
MIT License © 2026 Voice Studio AI.
