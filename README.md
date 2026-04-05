<div align="center">

# ⚡ VibeCheck

### Paste any text. Get a brutally honest emotional breakdown.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-vibe--check--api.vercel.app-a855f7?style=for-the-badge&logo=vercel&logoColor=white)](https://vibe-check-api.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-06b6d4?style=for-the-badge&logo=render&logoColor=white)](https://vibe-check-api-nfbi.onrender.com/api/health)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-f97316?style=for-the-badge)](https://groq.com)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)

<br/>

![VibeCheck Demo](https://vibe-check-api.vercel.app/og-image.png)

</div>

---

## 🔮 What Is VibeCheck?

VibeCheck is an AI-powered psycholinguistic analysis engine. You paste any piece of text — a tweet, email, Slack message, DM, or review — and it returns a clinically precise emotional and intent breakdown in under 2 seconds.

It thinks like a combination of:
- 🔬 **A forensic linguist** — what do the words literally signal?
- 🧠 **A therapist** — what is the subtext and emotional state?
- 🎯 **A negotiation expert** — what does this person actually want?
- 📊 **A behavioural psychologist** — what patterns are present?

---

## ✦ What You Get

| Feature | Description |
|---|---|
| **Vibe Score** | 0–100 score with animated SVG ring and level classification |
| **Dominant Emotion** | Primary + secondary emotion with intensity (0–100) |
| **Intent Detection** | What does this person actually want? With explanation |
| **Tone Profile** | Formality, aggression, warmth scored independently |
| **Tone Tags** | `#passive-aggressive` `#gaslighting` `#genuine` etc. |
| **Red Flags** | Detected manipulation patterns with severity rating (1–5) |
| **Rewrite Suggestion** | A better version of the text when vibe score < 60 |
| **Context-Aware** | Pass text type (email/tweet/DM) for sharper analysis |

### Vibe Score Levels

| Score | Level | Meaning |
|---|---|---|
| 0–20 | ☠️ TOXIC | Abusive, threatening, or manipulative |
| 21–40 | 🥶 LOW | Passive-aggressive, cold, pressuring |
| 41–60 | 😐 NEUTRAL | Flat, transactional, ambiguous |
| 61–80 | 🌊 WARM | Friendly, open, constructive |
| 81–100 | ✨ POSITIVE | Genuine, enthusiastic, supportive |

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   React 18 + Vite + Tailwind + Framer Motion                │
│   Deployed on Vercel                                         │
└─────────────────────┬───────────────────────────────────────┘
│ HTTPS (Axios)
│ X-Text-Type header
▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│   FastAPI + Uvicorn                                          │
│   Deployed on Render                                         │
│                                                              │
│   POST /api/analyze                                          │
│   GET  /api/demo                                             │
│   GET  /api/health                                           │
└─────────────────────┬───────────────────────────────────────┘
│ Groq SDK
▼
┌─────────────────────────────────────────────────────────────┐
│                      GROQ API                                │
│   Model: llama-3.3-70b-versatile                             │
│   God-mode system prompt with:                               │
│   • Injected enums (zero drift)                              │
│   • 10 red flag marker categories                            │
│   • 3 few-shot examples                                      │
│   • Vibe score calibration anchors                           │
│   • Full edge case handling                                  │
└─────────────────────────────────────────────────────────────┘

---

## 🗂️ Project Structure

vibe-check-api/
│
├── backend/
│   ├── models/
│   │   └── schemas.py          # Pydantic models with enums + validators
│   ├── prompts/
│   │   └── vibe_prompt.py      # God-mode system prompt + few-shot examples
│   ├── routes/
│   │   └── vibe.py             # FastAPI routes with granular error mapping
│   ├── services/
│   │   └── groq_service.py     # Groq client + retry + JSON extraction
│   ├── main.py                 # App factory + middleware + lifespan
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TextInput.jsx       # Drag-drop, clipboard paste, cycling placeholder
│       │   ├── VibeScore.jsx       # Animated SVG ring + tick marks + confidence arc
│       │   ├── EmotionBreakdown.jsx # Emotion bubbles + tone meters + intent badge
│       │   └── RewriteSuggestion.jsx # Typewriter effect + word highlighting
│       ├── App.jsx
│       └── index.css           # Full animation library + design system
│
├── render.yaml
└── README.md

---

## 🚀 Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com) (free)

### Backend
```bash
# Clone the repo
git clone https://github.com/Swapnil-bo/Vibe-Check-API.git
cd Vibe-Check-API

# Create and activate virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > backend/.env

# Start the backend
python -m uvicorn backend.main:app --reload --port 8000
```

Backend will be live at `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`
- Demo endpoint: `http://localhost:8000/api/demo`

### Frontend
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

Frontend will be live at `http://localhost:5173`

---

## 🌐 API Reference

### `POST /api/analyze`

Analyze the emotional vibe of any text.

**Request**
```json
{
  "text": "Hey, just following up again on this. Let me know when you get a chance."
}
```

**Optional Header**

X-Text-Type: email | tweet | slack/chat | text_message | review | unknown

**Response**
```json
{
  "summary": "Professionally masked impatience — polite surface, pressured core.",
  "emotion": {
    "primary": "anticipation",
    "secondary": "anger",
    "intensity": 68,
    "category": "anger"
  },
  "intent": "request",
  "intent_explanation": "Framed as casual but 'again' signals repeated asks and building frustration.",
  "tone": {
    "tags": ["#passive-aggressive", "#overpolite", "#impatient"],
    "formality": 65,
    "aggression": 42,
    "warmth": 22
  },
  "vibe": {
    "score": 34,
    "level": "low",
    "confidence": 88
  },
  "red_flags": [
    {
      "flag": "Softener: 'just'",
      "explanation": "'just' minimizes the request while masking repeated pressure.",
      "severity": 2
    }
  ],
  "rewrite_suggestion": "Hey! Could you give me an update on this when you have a moment?",
  "word_count": 16
}
```

### `GET /api/demo`
Returns a hardcoded example response. Zero Groq credits consumed. Use for frontend testing.

### `GET /api/health`
Returns service status.

---

## 🧠 The Prompt Engineering

The system prompt (`vibe_prompt.py`) is the soul of this project. Key design decisions:

**Zero enum drift** — Valid emotion, intent, and vibe level values are injected directly from Python enums into the prompt. If you add a new emotion to the schema, the prompt updates automatically.

**Red flag detection reference** — 10 categories of toxic language patterns (softeners, gaslighting, guilt-tripping, love-bombing, negging, etc.) are baked in as a detection reference table with example phrases.

**Calibration anchors** — The vibe score isn't vague. Real-world anchor examples are included: `"As per my last email" = 40`, `"You'll regret this" = 20`, `"Great work!" = 80`.

**3 few-shot examples** — The model learns from demonstration, not just instruction. Each example shows the full expected JSON output for passive-aggressive, backhanded, and genuinely warm text.

**Edge case hardening** — All-caps text, emojis, very short text, ambiguous text, and slang are all explicitly handled with specific instructions.

---

## 🛡️ Technical Highlights

- **Retry architecture** — Exponential backoff on rate limits, linear backoff on timeouts, immediate fail on 4xx errors
- **3-layer JSON extraction** — Direct parse → strip markdown fences → find `{}` boundaries. Handles misbehaving LLMs
- **Response validation** — Auto-corrects vibe level if it doesn't match score range. Auto-corrects word count if off by more than 3
- **Startup validation** — Missing API key fails loudly at boot, never silently at request time
- **Granular error mapping** — Rate limit → 429, timeout → 503, missing key → 503, parse failure → 500
- **GZip middleware** — Responses over 1KB compressed automatically
- **`X-Process-Time` header** — Every response carries its processing time in milliseconds

---

## 🎨 Frontend Highlights

- **Animated SVG score ring** — Strokes from 0 → score over 1.4s with tick marks, endpoint dot, and confidence outer arc
- **Typewriter rewrite** — Rewrite suggestion types itself out character by character with a blinking cursor
- **Drag & drop textarea** — Drop any text directly onto the input area
- **Cycling placeholder** — 6 different placeholder prompts rotate every 3 seconds
- **Framer Motion orchestration** — Results cascade in with staggered animations via `staggerChildren`
- **Word highlighting** — Positive signal words in the rewrite glow green after typing completes
- **Scanning line** — Violet → cyan beam sweeps the textarea during analysis

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| LLM | Groq API (llama-3.3-70b-versatile) |
| HTTP Client | Axios |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| Fonts | Bricolage Grotesque, DM Sans, JetBrains Mono |

---

## 🗺️ Roadmap

- [ ] History — save and revisit past analyses
- [ ] Batch mode — analyze multiple texts at once
- [ ] Chrome extension — check the vibe of any text on any webpage
- [ ] API access — let developers integrate VibeCheck into their apps
- [ ] Side-by-side compare — paste original vs rewrite and see the score delta

---

## 👤 Author

**Swapnil Hazra** — Building in public, one vibe at a time.

[![Twitter](https://img.shields.io/badge/@SwapnilHazra4-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/SwapnilHazra4)
[![GitHub](https://img.shields.io/badge/Swapnil--bo-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Swapnil-bo)

Built as part of **#100DaysOfVibeCoding** — shipping one AI project every day.

---

<div align="center">

**If this gave you a vibe, star the repo ⭐**

</div>