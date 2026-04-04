import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import TextInput     from "./components/TextInput";
import VibeScore     from "./components/VibeScore";
import EmotionBreakdown   from "./components/EmotionBreakdown";
import RewriteSuggestion  from "./components/RewriteSuggestion";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "https://vibe-check-api-nfbi.onrender.com/api";;

const TEXT_TYPES = [
  { value: "unknown",      label: "Auto detect",  emoji: "🔮" },
  { value: "email",        label: "Email",         emoji: "📧" },
  { value: "tweet",        label: "Tweet",         emoji: "🐦" },
  { value: "slack/chat",   label: "Slack / Chat",  emoji: "💬" },
  { value: "text_message", label: "Text Message",  emoji: "📱" },
  { value: "review",       label: "Review",        emoji: "⭐" },
];

const EXAMPLE_TEXTS = [
  {
    label: "Passive-aggressive email",
    text: "Hey, just following up again on this. As per my last email, I already addressed this concern. Going forward, please make sure to review my messages before reaching out. Let me know when you get a chance.",
    type: "email",
  },
  {
    label: "Backhanded compliment",
    text: "Wow, I'm SO proud of you! You actually finished something for once! I honestly didn't think you had it in you. Must be nice when things finally work out.",
    type: "unknown",
  },
  {
    label: "Genuine appreciation",
    text: "I just wanted to say thank you for always being there. You genuinely make everything better and I don't say that enough. You mean a lot to me.",
    type: "text_message",
  },
  {
    label: "Corporate threat",
    text: "This is a final notice regarding your performance metrics. Going forward, failure to meet targets will result in consequences. I suggest you circle back with your manager and align on priorities immediately.",
    type: "email",
  },
];

// ─── Animation Variants ───────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const resultsVariants = {
  hidden:  { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const resultItemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [text,       setText]       = useState("");
  const [textType,   setTextType]   = useState("unknown");
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [charCount,  setCharCount]  = useState(0);
  const [lastText,   setLastText]   = useState("");
  const resultsRef = useRef(null);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleTextChange = useCallback((val) => {
    setText(val);
    setCharCount(val.length);
    if (error) setError(null);
  }, [error]);

  const handleExampleClick = useCallback((example) => {
    setText(example.text);
    setTextType(example.type);
    setCharCount(example.text.length);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setText("");
    setTextType("unknown");
    setCharCount(0);
    setResult(null);
    setError(null);
    setLastText("");
  }, []);

  const handleAnalyze = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === lastText) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await axios.post(
        `${API_BASE}/analyze`,
        { text: trimmed },
        {
          headers: {
            "Content-Type":  "application/json",
            "X-Text-Type":   textType,
          },
          timeout: 35_000,
        }
      );

      setResult(data);
      setLastText(trimmed);

      // Smooth scroll to results after mount
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);

    } catch (err) {
      let message = "Something went wrong. Please try again.";

      if (err.code === "ECONNABORTED") {
        message = "Request timed out. Groq might be busy — try again.";
      } else if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;
        if (status === 400) message = detail || "Invalid input.";
        else if (status === 422) message = "Text validation failed. " + (err.response.data?.hint || "");
        else if (status === 429) message = "Rate limit hit. Wait a moment and try again.";
        else if (status === 503) message = "Analysis service is unavailable. Check your API key.";
        else message = detail || message;
      } else if (err.request) {
        message = "Could not reach the server. Is the backend running?";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [text, textType, lastText]);

  const handleDemoClick = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await axios.get(`${API_BASE}/demo`);
      setResult(data);
      setText("Hey, just following up again on this. Let me know when you get a chance.");
      setCharCount(71);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch {
      setError("Demo endpoint unavailable. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  const canAnalyze = text.trim().length >= 5 && !loading;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.header className="app-header" variants={itemVariants}>
          <div className="app-logo">⚡ VibeCheck</div>
          <p className="app-tagline">
            Paste any text. Get a brutally honest emotional breakdown.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {["tweet", "email", "DM", "review", "Slack"].map((t) => (
              <span
                key={t}
                className="tone-tag"
                style={{ fontSize: "0.6875rem", padding: "0.2rem 0.625rem" }}
              >
                {t}
              </span>
            ))}
          </div>
        </motion.header>

        <hr className="vibe-divider" style={{ marginBottom: "1.5rem" }} />

        {/* ── Input Section ──────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <TextInput
            text={text}
            textType={textType}
            charCount={charCount}
            loading={loading}
            canAnalyze={canAnalyze}
            textTypes={TEXT_TYPES}
            onTextChange={handleTextChange}
            onTextTypeChange={setTextType}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            onDemo={handleDemoClick}
          />
        </motion.div>

        {/* ── Example Pills ──────────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginTop: "0.875rem",
          }}
        >
          <span
            className="heading-sm"
            style={{ width: "100%", marginBottom: "0.25rem" }}
          >
            Try an example
          </span>
          {EXAMPLE_TEXTS.map((ex, i) => (
            <motion.button
              key={i}
              className="btn btn-ghost"
              onClick={() => handleExampleClick(ex)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontSize: "0.75rem",
                padding: "0.35rem 0.875rem",
                border: "1px solid var(--border-subtle)",
                borderRadius: "999px",
              }}
            >
              {ex.label}
            </motion.button>
          ))}
        </motion.div>

        {/* ── Error Banner ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner"
              style={{ marginTop: "1rem" }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading State ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                marginTop: "2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.25rem",
              }}
            >
              {/* Scanning animation bar */}
              <div style={{
                width: "100%",
                height: "3px",
                background: "var(--bg-elevated)",
                borderRadius: "999px",
                overflow: "hidden",
                position: "relative",
              }}>
                <motion.div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, var(--accent-violet), var(--accent-cyan), var(--accent-pink))",
                    borderRadius: "999px",
                    backgroundSize: "200% auto",
                  }}
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div style={{ textAlign: "center" }}>
                <motion.p
                  className="heading-sm"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  style={{ letterSpacing: "0.12em" }}
                >
                  ANALYZING VIBES
                </motion.p>
                <p className="body-text" style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>
                  Reading between the lines...
                </p>
              </div>

              {/* Animated dots */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))`,
                    }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.div
              ref={resultsRef}
              key={lastText}
              variants={resultsVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ marginTop: "2.5rem" }}
            >
              {/* Summary banner */}
              <motion.div
                variants={resultItemVariants}
                className="card-glow"
                style={{ marginBottom: "1.25rem", textAlign: "center" }}
              >
                <p className="heading-sm" style={{ marginBottom: "0.5rem" }}>
                  VIBE SUMMARY
                </p>
                <p
                  className="shimmer-text"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.4,
                  }}
                >
                  {result.summary}
                </p>
              </motion.div>

              {/* Score + Emotion row */}
              <motion.div
                variants={resultItemVariants}
                className="two-col"
                style={{ marginBottom: "1.25rem" }}
              >
                <VibeScore vibe={result.vibe} />
                <EmotionBreakdown
                  emotion={result.emotion}
                  intent={result.intent}
                  intentExplanation={result.intent_explanation}
                  tone={result.tone}
                  wordCount={result.word_count}
                />
              </motion.div>

              {/* Red flags */}
              <AnimatePresence>
                {result.red_flags?.length > 0 && (
                  <motion.div
                    variants={resultItemVariants}
                    className="card"
                    style={{ marginBottom: "1.25rem" }}
                  >
                    <p className="heading-sm" style={{ marginBottom: "1rem" }}>
                      🚩 Red Flags Detected — {result.red_flags.length}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {result.red_flags.map((flag, i) => (
                        <motion.div
                          key={i}
                          className="red-flag-item animate-flag-slide"
                          style={{ animationDelay: `${i * 80}ms` }}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {/* Severity dots */}
                          <div className="red-flag-severity">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <div
                                key={dot}
                                className={`severity-dot ${dot <= flag.severity ? "active" : ""}`}
                              />
                            ))}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                              color: "var(--text-primary)",
                              marginBottom: "0.2rem",
                            }}>
                              {flag.flag}
                            </p>
                            <p className="body-text" style={{ fontSize: "0.8125rem" }}>
                              {flag.explanation}
                            </p>
                          </div>
                          <span
                            className="mono-text"
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--accent-red)",
                              flexShrink: 0,
                              alignSelf: "flex-start",
                              paddingTop: "2px",
                            }}
                          >
                            {flag.severity}/5
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No red flags */}
              <AnimatePresence>
                {result.red_flags?.length === 0 && (
                  <motion.div
                    variants={resultItemVariants}
                    className="card"
                    style={{
                      marginBottom: "1.25rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      padding: "1rem 1.25rem",
                      background: "rgba(16, 185, 129, 0.04)",
                      borderColor: "rgba(16, 185, 129, 0.15)",
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>✅</span>
                    <div>
                      <p style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "var(--accent-emerald)",
                        marginBottom: "0.125rem",
                      }}>
                        No red flags detected
                      </p>
                      <p className="body-text" style={{ fontSize: "0.8125rem" }}>
                        Clean communication — no manipulative or problematic patterns found.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rewrite suggestion */}
              <AnimatePresence>
                {result.rewrite_suggestion && (
                  <motion.div variants={resultItemVariants} style={{ marginBottom: "1.25rem" }}>
                    <RewriteSuggestion suggestion={result.rewrite_suggestion} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyze again / clear */}
              <motion.div
                variants={resultItemVariants}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "center",
                  paddingTop: "0.5rem",
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={handleClear}
                  style={{ fontSize: "0.875rem" }}
                >
                  ✦ Check another vibe
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!result && !loading && !error && (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
              exit={{ opacity: 0 }}
              style={{ marginTop: "3rem" }}
            >
              <div className="empty-icon">🔮</div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem", color: "var(--text-secondary)" }}>
                Your vibe breakdown will appear here
              </p>
              <p style={{ fontSize: "0.8125rem", maxWidth: "320px", lineHeight: 1.6 }}>
                Paste a tweet, email, DM, review — anything. We'll tell you exactly what energy it's giving.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="app-footer" style={{ marginTop: "4rem" }}>
          <p>
            built by{" "}
            <a href="https://twitter.com/SwapnilHazra4" target="_blank" rel="noopener noreferrer">
              @SwapnilHazra4
            </a>
            {" "}· powered by{" "}
            <a href="https://groq.com" target="_blank" rel="noopener noreferrer">
              Groq
            </a>
            {" "}· 100 Days of Vibe Coding
          </p>
        </footer>

      </motion.div>
    </div>
  );
}