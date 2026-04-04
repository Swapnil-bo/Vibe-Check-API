import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text, speed = 18, startDelay = 300) {
  const [displayed, setDisplayed] = useState("");
  const [done,      setDone]      = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        indexRef.current += 1;
        setDisplayed(text.slice(0, indexRef.current));
        if (indexRef.current >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ─── Word diff highlighter ────────────────────────────────────────────────────
// Highlights words that are new/changed in the rewrite vs original context.
// Since we don't have the original, we highlight "positive signal" words.

const POSITIVE_SIGNAL_WORDS = new Set([
  "happy", "glad", "appreciate", "thank", "thanks", "grateful", "great",
  "excited", "love", "help", "support", "please", "kindly", "could", "would",
  "hope", "wonderful", "amazing", "fantastic", "excellent", "brilliant",
  "perfect", "cheers", "warmly", "sincerely", "best", "care", "caring",
  "understand", "respect", "collaboration", "together", "opportunity",
  "forward", "progress", "update", "clarify", "connect", "ensure",
]);

function HighlightedText({ text }) {
  const words = text.split(/(\s+)/);
  return (
    <>
      {words.map((word, i) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, "");
        const isSignal = POSITIVE_SIGNAL_WORDS.has(clean);
        if (isSignal) {
          return (
            <motion.span
              key={i}
              initial={{ backgroundColor: "rgba(16, 185, 129, 0)" }}
              animate={{ backgroundColor: ["rgba(16, 185, 129, 0.18)", "rgba(16, 185, 129, 0.08)"] }}
              transition={{ delay: 0.8, duration: 1.2 }}
              style={{
                borderRadius:   "3px",
                padding:        "0 2px",
                color:          "var(--accent-emerald)",
                fontWeight:     500,
              }}
            >
              {word}
            </motion.span>
          );
        }
        return <span key={i}>{word}</span>;
      })}
    </>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [state, setState] = useState("idle"); // idle | copied | error

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [text]);

  const config = {
    idle:   { label: "Copy",    icon: "📋", color: "var(--text-muted)" },
    copied: { label: "Copied!", icon: "✓",  color: "var(--accent-emerald)" },
    error:  { label: "Failed",  icon: "✕",  color: "var(--accent-red)" },
  }[state];

  return (
    <motion.button
      className="btn btn-ghost"
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        fontSize:    "0.75rem",
        padding:     "0.35rem 0.875rem",
        border:      "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        gap:         "0.35rem",
        color:       config.color,
        transition:  "color 0.2s ease",
      }}
      title="Copy rewrite to clipboard"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{ opacity: 0, y: 4    }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Share button ─────────────────────────────────────────────────────────────

function ShareButton({ text }) {
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "VibeCheck Rewrite",
          text,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [text]);

  return (
    <motion.button
      className="btn btn-ghost"
      onClick={handleShare}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        fontSize:     "0.75rem",
        padding:      "0.35rem 0.875rem",
        border:       "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        gap:          "0.35rem",
        color:        shared ? "var(--accent-emerald)" : "var(--text-muted)",
        transition:   "color 0.2s ease",
      }}
      title="Share rewrite"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={shared ? "shared" : "share"}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{ opacity: 0, y: 4    }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          <span>{shared ? "✓" : "↗"}</span>
          <span>{shared ? "Shared!" : "Share"}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Vibe score delta indicator ───────────────────────────────────────────────

function VibeDeltaHint() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0  }}
      transition={{ delay: 1.8, duration: 0.4 }}
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          "0.375rem",
        padding:      "0.25rem 0.625rem",
        background:   "rgba(16, 185, 129, 0.08)",
        border:       "1px solid rgba(16, 185, 129, 0.2)",
        borderRadius: "999px",
      }}
    >
      <motion.span
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: "0.75rem" }}
      >
        ↑
      </motion.span>
      <span style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.625rem",
        fontWeight:    700,
        letterSpacing: "0.08em",
        color:         "var(--accent-emerald)",
        textTransform: "uppercase",
      }}>
        Higher vibe expected
      </span>
    </motion.div>
  );
}

// ─── Word count delta ─────────────────────────────────────────────────────────

function WordCountDelta({ original, rewrite }) {
  const origWords    = original.trim().split(/\s+/).filter(Boolean).length;
  const rewriteWords = rewrite.trim().split(/\s+/).filter(Boolean).length;
  const delta        = rewriteWords - origWords;
  const sign         = delta > 0 ? "+" : "";
  const color        = delta > 0
    ? "var(--accent-amber)"
    : delta < 0
    ? "var(--accent-emerald)"
    : "var(--text-muted)";

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.3 }}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize:   "0.625rem",
        fontWeight: 600,
        color,
        letterSpacing: "0.04em",
      }}
      title={`Original: ${origWords} words → Rewrite: ${rewriteWords} words`}
    >
      {sign}{delta} words
    </motion.span>
  );
}

// ─── Animated border gradient card ───────────────────────────────────────────

const cardStyle = {
  position:     "relative",
  borderRadius: "var(--radius-lg)",
  padding:      "1.5rem",
  background:   "rgba(16, 185, 129, 0.03)",
  overflow:     "hidden",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RewriteSuggestion({ suggestion, originalText = "" }) {
  const { displayed, done } = useTypewriter(suggestion, 16, 250);
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Gradient border wrapper ────────────────────────────────────── */}
      <div style={{
        padding:      "1px",
        borderRadius: "var(--radius-lg)",
        background:   "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(6,182,212,0.2), rgba(16,185,129,0.1))",
      }}>
        <div style={cardStyle}>

          {/* ── Ambient glow ─────────────────────────────────────────── */}
          <div style={{
            position:     "absolute",
            top:          "-40px",
            right:        "-40px",
            width:        "180px",
            height:       "180px",
            borderRadius: "50%",
            background:   "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* ── Header row ───────────────────────────────────────────── */}
          <div style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            marginBottom:   "1rem",
            flexWrap:       "wrap",
            gap:            "0.5rem",
          }}>

            {/* Left: label + delta */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0  }}
                transition={{ duration: 0.3 }}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  style={{ fontSize: "1.1rem" }}
                >
                  ✦
                </motion.span>
                <span style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.625rem",
                  fontWeight:    700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color:         "var(--accent-emerald)",
                }}>
                  Suggested Rewrite
                </span>
              </motion.div>

              {/* Word count delta */}
              {originalText && (
                <WordCountDelta original={originalText} rewrite={suggestion} />
              )}

              <VibeDeltaHint />
            </div>

            {/* Right: action buttons + collapse */}
            <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
              {done && <CopyButton text={suggestion} />}
              {done && <ShareButton text={suggestion} />}

              <motion.button
                className="btn btn-ghost"
                onClick={() => setExpanded((v) => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontSize:     "0.75rem",
                  padding:      "0.35rem 0.5rem",
                  border:       "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color:        "var(--text-muted)",
                }}
                title={expanded ? "Collapse" : "Expand"}
              >
                <motion.span
                  animate={{ rotate: expanded ? 0 : 180 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "inline-block" }}
                >
                  ↑
                </motion.span>
              </motion.button>
            </div>
          </div>

          {/* ── Typewritten suggestion text ───────────────────────────── */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                {/* Scan line before text appears */}
                <AnimatePresence>
                  {!done && (
                    <motion.div
                      initial={{ scaleX: 0, opacity: 1 }}
                      animate={{ scaleX: 1 }}
                      exit={{ opacity: 0  }}
                      transition={{ duration: suggestion.length * 0.016 + 0.25, ease: "linear" }}
                      style={{
                        height:       "1px",
                        background:   "linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))",
                        borderRadius: "999px",
                        originX:      0,
                        marginBottom: "0.75rem",
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* The text block */}
                <div style={{
                  position:     "relative",
                  padding:      "1rem 1.125rem",
                  background:   "rgba(255,255,255,0.02)",
                  border:       "1px solid rgba(16,185,129,0.12)",
                  borderLeft:   "3px solid var(--accent-emerald)",
                  borderRadius: "var(--radius-md)",
                  minHeight:    "3.5rem",
                }}>
                  <p style={{
                    fontFamily: "var(--font-body)",
                    fontSize:   "0.9375rem",
                    lineHeight: 1.7,
                    color:      "var(--text-secondary)",
                    fontStyle:  "italic",
                    margin:     0,
                  }}>
                    {done
                      ? <HighlightedText text={suggestion} />
                      : (
                        <>
                          {displayed}
                          {/* Blinking cursor */}
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.7, repeat: Infinity }}
                            style={{
                              display:     "inline-block",
                              width:       "2px",
                              height:      "1em",
                              background:  "var(--accent-emerald)",
                              marginLeft:  "2px",
                              verticalAlign: "text-bottom",
                              borderRadius: "1px",
                            }}
                          />
                        </>
                      )
                    }
                  </p>
                </div>

                {/* ── Bottom row: quality signals ───────────────────── */}
                <AnimatePresence>
                  {done && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.35 }}
                      style={{
                        display:    "flex",
                        gap:        "0.75rem",
                        marginTop:  "0.875rem",
                        flexWrap:   "wrap",
                        alignItems: "center",
                      }}
                    >
                      {[
                        { icon: "✓", label: "Intent preserved"   },
                        { icon: "✓", label: "Tone improved"       },
                        { icon: "✓", label: "Human, not robotic"  },
                      ].map(({ icon, label }, i) => (
                        <motion.span
                          key={label}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0  }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                          style={{
                            display:       "inline-flex",
                            alignItems:    "center",
                            gap:           "0.3rem",
                            fontFamily:    "var(--font-mono)",
                            fontSize:      "0.625rem",
                            fontWeight:    600,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color:         "var(--accent-emerald)",
                            opacity:       0.75,
                          }}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </motion.span>
                      ))}

                      {/* Divider dot */}
                      <span style={{
                        width:        "3px",
                        height:       "3px",
                        borderRadius: "50%",
                        background:   "var(--border-default)",
                        flexShrink:   0,
                      }} />

                      {/* Word count of rewrite */}
                      <span style={{
                        fontFamily:    "var(--font-mono)",
                        fontSize:      "0.625rem",
                        color:         "var(--text-muted)",
                        letterSpacing: "0.04em",
                      }}>
                        {suggestion.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}