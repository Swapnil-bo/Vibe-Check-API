import os
import time
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

# ─── Load env FIRST — before any other backend imports ───────────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.routes.vibe import router as vibe_router

# ─── Load env first — before anything else reads it ───────────────────────────

load_dotenv()


# ─── Logging Setup ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("vibe_main")


# ─── Startup Validation ───────────────────────────────────────────────────────

def _validate_environment() -> None:
    """
    Validates all required environment variables at startup.
    Fails loudly and early — never silently at request time.
    """
    required = {
        "GROQ_API_KEY": "Groq API key for LLM inference",
    }

    missing = [
        f"  • {key} — {desc}"
        for key, desc in required.items()
        if not os.getenv(key)
    ]

    if missing:
        logger.critical(
            "═══════════════════════════════════════════════\n"
            "  STARTUP FAILED — Missing environment variables:\n"
            + "\n".join(missing) + "\n"
            "  Add them to your .env file and restart.\n"
            "═══════════════════════════════════════════════"
        )
        sys.exit(1)

    logger.info("✓ Environment validation passed")


# ─── Lifespan (replaces deprecated @app.on_event) ────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown lifecycle.
    Everything before yield runs on startup.
    Everything after yield runs on shutdown.
    """
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("═══════════════════════════════════════════════")
    logger.info("  VibeCheck API — Starting up")
    logger.info("═══════════════════════════════════════════════")

    _validate_environment()

    logger.info(f"✓ Model        : llama-3.3-70b-versatile via Groq")
    logger.info(f"✓ Docs         : http://localhost:8000/docs")
    logger.info(f"✓ Health       : http://localhost:8000/api/health")
    logger.info(f"✓ Demo         : http://localhost:8000/api/demo")
    logger.info(f"✓ Analyze      : POST http://localhost:8000/api/analyze")
    logger.info("═══════════════════════════════════════════════")
    logger.info("  VibeCheck API is LIVE. Let's get weird.")
    logger.info("═══════════════════════════════════════════════")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("VibeCheck API shutting down. Goodbye. 👋")


# ─── App Factory ──────────────────────────────────────────────────────────────

def create_app() -> FastAPI:

    app = FastAPI(
        title="VibeCheck API",
        description="""
## 🔮 VibeCheck API

Paste any text — a tweet, email, Slack message, DM, or review —
and get back a **brutally honest emotional and intent breakdown**.

### What you get
- **Dominant emotion** with intensity score (0–100)
- **Intent classification** — what does this person actually want?
- **Tone profile** — formality, aggression, warmth + tone tags
- **Vibe Score** (0–100) with level: `toxic` / `low` / `neutral` / `warm` / `positive`
- **Red flags** with severity ratings (1–5) — gaslighting, negging, guilt-tripping, and more
- **Rewrite suggestion** — a better version when the vibe score is low
- **Word count** of the input

### Optional header
Pass `X-Text-Type` with one of: `tweet`, `email`, `slack/chat`, `review`, `text_message`
for context-aware analysis.

### Demo endpoint
Hit `GET /api/demo` to get a hardcoded example response — no API credits consumed.

---
Built with **FastAPI + Groq (llama-3.3-70b-versatile)** as part of the 100 Days of Vibe Coding challenge.
        """,
        version="1.0.0",
        contact={
            "name": "Swapnil Hazra",
            "url": "https://github.com/Swapnil-bo/Vibe-Check-API",
        },
        license_info={
            "name": "MIT",
        },
        openapi_tags=[
            {
                "name": "VibeCheck",
                "description": "Core vibe analysis endpoints.",
            },
        ],
        lifespan=lifespan,
    )

    # ── Middlewares ───────────────────────────────────────────────────────────

    # CORS — allow frontend dev server + production
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",   # Vite dev server
            "http://localhost:3000",   # fallback CRA
            "http://127.0.0.1:5173",
            "https://vibe-check-api-swapnil-bos-projects.vercel.app",  # ← your actual Vercel URL
            "https://vibe-check-api.vercel.app",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    # GZip — compress responses > 1KB automatically
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ── Request Timing Middleware ─────────────────────────────────────────────
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration = round(time.monotonic() - start, 4)
        response.headers["X-Process-Time"] = str(duration)
        return response

    # ── Request Logger Middleware ─────────────────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(f"→ {request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"← {request.method} {request.url.path} | {response.status_code}")
        return response

    # ── Global Exception Handlers ─────────────────────────────────────────────

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """
        Overrides FastAPI's default 422 response with a cleaner message.
        """
        errors = exc.errors()
        messages = []
        for err in errors:
            field = " → ".join(str(loc) for loc in err["loc"])
            messages.append(f"{field}: {err['msg']}")

        logger.warning(f"Validation error on {request.url.path}: {messages}")

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error":   "Validation failed",
                "details": messages,
                "hint":    "Check your request body. 'text' must be a non-empty string between 5 and 2000 characters.",
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """
        Catches any unhandled exception and returns a clean 500.
        Never leaks internal stack traces to the client.
        """
        logger.exception(f"Unhandled exception on {request.url.path}: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "hint":  "Something went wrong on our end. Please try again.",
            },
        )

    # ── Routers ───────────────────────────────────────────────────────────────

    app.include_router(vibe_router)

    # ── Root redirect ─────────────────────────────────────────────────────────

    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "service": "VibeCheck API",
            "version": "1.0.0",
            "status":  "running",
            "docs":    "/docs",
            "health":  "/api/health",
            "analyze": "POST /api/analyze",
            "demo":    "GET /api/demo",
        }

    return app


# ─── App Instance ─────────────────────────────────────────────────────────────

app = create_app()


# ─── Dev Runner ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )