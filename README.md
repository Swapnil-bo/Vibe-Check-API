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