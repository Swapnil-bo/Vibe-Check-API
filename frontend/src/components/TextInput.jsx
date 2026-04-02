import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS   = 2000;
const WARN_CHARS  = 1800;
const MIN_CHARS   = 5;

const PLACEHOLDER_CYCLES = [
  "Paste a tweet you're not sure about...",
  "Drop that passive-aggressive email here...",
  "That DM that gave you an odd feeling...",
  "A review that seems off...",
  "That Slack message you re-read 4 times...",
  "The text that made you go 'hmm'...",
];

// ─── Char counter color logic ──────────────────────────────────────────────────

function getCounterStyle(count) {
  if (count >= MAX_CHARS)  return { color: "var(--accent-red)",    fontWeight: 700 };
  if (count >= WARN_CHARS) return { color: "var(--accent-amber)",  fontWeight: 600 };
  if (count > 0)           return { color: "var(--text-muted)",    fontWeight: 400 };
  return                          { color: "var(--text-muted)",    fontWeight: 400 };
}

// ─── Keyboard shortcut hint ────────────────────────────────────────────────────

function KbdHint({ keys, label }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      fontFamily: "var(--font-mono)",
      fontSize: "0.6875rem",
      color: "var(--text-muted)",
    }}>
      {keys.map((k, i) => (
        <kbd key={i} style={{
          display: "inline-block",
          padding: "0.1rem 0.35rem",
          background: "var(--bg-overlay)",
          border: "1px solid var(--border-default)",
          borderRadius: "4px",
          fontSize: "0.625rem",
          fontFamily: "var(--font-mono)",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}>
          {k}
        </kbd>
      ))}
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
    </span>
  );
}

// ─── Text Type Selector ────────────────────────────────────────────────────────

function TextTypeSelector({ textTypes, value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <span className="heading-sm" style={{ letterSpacing: "0.06em" }}>
        Context
      </span>
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        {textTypes.map((type) => {
          const isActive = value === type.value;
          return (
            <motion.button
              key={type.value}
              onClick={() => !disabled && onChange(type.value)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.04 } : {}}
              whileTap={!disabled  ? { scale: 0.96 } : {}}
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                gap:            "0.3rem",
                fontFamily:     "var(--font-mono)",
                fontSize:       "0.6875rem",
                fontWeight:     isActive ? 700 : 400,
                padding:        "0.3rem 0.625rem",
                borderRadius:   "999px",
                border:         `1px solid ${isActive ? "var(--accent-violet)" : "var(--border-subtle)"}`,
                background:     isActive
                  ? "rgba(168, 85, 247, 0.12)"
                  : "var(--bg-elevated)",
                color:          isActive ? "var(--accent-violet)" : "var(--text-muted)",
                cursor:         disabled ? "not-allowed" : "pointer",
                opacity:        disabled ? 0.5 : 1,
                transition:     "all 0.2s ease",
                whiteSpace:     "nowrap",
              }}
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
              {isActive && (
                <motion.span
                  layoutId="type-indicator"
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "var(--accent-violet)",
                    display: "inline-block",
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Word / Sentence Stats ─────────────────────────────────────────────────────

function TextStats({ text }) {
  if (!text.trim()) return null;

  const words     = text.trim().split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const readTime  = Math.max(1, Math.round(words / 200));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "words",     value: words },
          { label: "sentences", value: sentences },
          { label: "min read",  value: readTime },
        ].map(({ label, value }) => (
          <span
            key={label}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              {value}
            </span>
            {" "}{label}
          </span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Paste Button ──────────────────────────────────────────────────────────────

function PasteButton({ onPaste, disabled }) {
  const [pasted, setPasted] = useState(false);

  const handleClick = useCallback(async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onPaste(clipText);
        setPasted(true);
        setTimeout(() => setPasted(false), 1800);
      }
    } catch {
      // Clipboard API blocked — silently fail
    }
  }, [onPaste]);

  return (
    <motion.button
      className="btn btn-ghost"
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={{
        fontSize: "0.75rem",
        padding: "0.35rem 0.75rem",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        gap: "0.3rem",
      }}
      title="Paste from clipboard"
    >
      <AnimatePresence mode="wait">
        {pasted ? (
          <motion.span
            key="pasted"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ color: "var(--accent-emerald)" }}
          >
            ✓ Pasted
          </motion.span>
        ) : (
          <motion.span
            key="paste"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            📋 Paste
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Animated Placeholder ──────────────────────────────────────────────────────

function useCyclingPlaceholder(active) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % PLACEHOLDER_CYCLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [active]);

  return PLACEHOLDER_CYCLES[index];
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TextInput({
  text,
  textType,
  charCount,
  loading,
  canAnalyze,
  textTypes,
  onTextChange,
  onTextTypeChange,
  onAnalyze,
  onClear,
  onDemo,
}) {
  const textareaRef  = useRef(null);
  const [focused, setFocused] = useState(false);
  const placeholder  = useCyclingPlaceholder(!text && !loading);

  // ── Keyboard shortcut: Ctrl+Enter to analyze ────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (canAnalyze) onAnalyze();
    }
    if (e.key === "Escape" && text) {
      e.preventDefault();
      onClear();
    }
  }, [canAnalyze, onAnalyze, onClear, text]);

  // ── Drag & Drop support ──────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true);  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop      = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.getData("text/plain");
    if (dropped) {
      onTextChange(dropped.slice(0, MAX_CHARS));
      textareaRef.current?.focus();
    }
  }, [onTextChange]);

  // ── Border glow color based on char count ───────────────────────────────
  const borderColor = (() => {
    if (charCount >= MAX_CHARS)  return "var(--accent-red)";
    if (charCount >= WARN_CHARS) return "var(--accent-amber)";
    if (focused && charCount > 0) return "var(--accent-violet)";
    if (focused)                  return "var(--accent-violet)";
    return "var(--border-subtle)";
  })();

  const boxShadow = (() => {
    if (charCount >= MAX_CHARS)  return "0 0 0 3px rgba(239, 68, 68, 0.12)";
    if (charCount >= WARN_CHARS) return "0 0 0 3px rgba(245, 158, 11, 0.12)";
    if (focused)                  return "0 0 0 3px rgba(168, 85, 247, 0.12)";
    return "none";
  })();

  const counterStyle = getCounterStyle(charCount);

  return (
    <motion.div
      className="card-elevated"
      style={{ padding: "1.25rem", position: "relative", overflow: "hidden" }}
      animate={isDragging ? { scale: 1.01, borderColor: "var(--accent-violet)" } : {}}
      transition={{ duration: 0.15 }}
    >

      {/* ── Drag overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position:   "absolute",
              inset:      0,
              background: "rgba(168, 85, 247, 0.08)",
              border:     "2px dashed var(--accent-violet)",
              borderRadius: "var(--radius-lg)",
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex:     10,
              pointerEvents: "none",
            }}
          >
            <p style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--accent-violet)",
            }}>
              Drop text to analyze ✦
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top row: context selector + paste ─────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        marginBottom: "0.875rem",
      }}>
        <TextTypeSelector
          textTypes={textTypes}
          value={textType}
          onChange={onTextTypeChange}
          disabled={loading}
        />
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
          <PasteButton onPaste={onTextChange} disabled={loading} />
          {text && (
            <motion.button
              className="btn btn-ghost"
              onClick={onClear}
              disabled={loading}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                fontSize: "0.75rem",
                padding: "0.35rem 0.75rem",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
              title="Clear text (Esc)"
            >
              ✕ Clear
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Textarea ──────────────────────────────────────────────────── */}
      <div
        style={{ position: "relative" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          className="vibe-textarea"
          value={text}
          onChange={(e) => onTextChange(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={loading}
          aria-label="Text to analyze"
          aria-describedby="char-counter text-stats"
          rows={6}
          style={{
            borderColor,
            boxShadow,
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            cursor: loading ? "not-allowed" : "text",
            opacity: loading ? 0.6 : 1,
          }}
        />

        {/* Scanning line while loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ top: "0%", opacity: 0 }}
              animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position:   "absolute",
                left:       0,
                right:      0,
                height:     "2px",
                background: "linear-gradient(90deg, transparent, var(--accent-violet), var(--accent-cyan), transparent)",
                pointerEvents: "none",
                borderRadius:  "999px",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom meta row: stats + counter ──────────────────────────── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "0.625rem",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}>
        <div id="text-stats">
          <TextStats text={text} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Char counter */}
          <motion.span
            id="char-counter"
            className="mono-text"
            style={{
              fontSize: "0.6875rem",
              ...counterStyle,
              transition: "color 0.2s ease",
            }}
            animate={charCount >= MAX_CHARS ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </motion.span>
        </div>
      </div>

      <hr className="vibe-divider" style={{ margin: "1rem 0 0.875rem" }} />

      {/* ── Action row ────────────────────────────────────────────────── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        flexWrap:       "wrap",
        gap:            "0.75rem",
      }}>

        {/* Left: keyboard hint */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <KbdHint keys={["Ctrl", "↵"]} label="to analyze" />
          <KbdHint keys={["Esc"]}       label="to clear" />
        </div>

        {/* Right: demo + analyze */}
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          <motion.button
            className="btn btn-secondary"
            onClick={onDemo}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ fontSize: "0.8125rem", padding: "0.625rem 1.125rem" }}
            title="Load a demo response without using API credits"
          >
            ✦ Demo
          </motion.button>

          <motion.button
            className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
            onClick={onAnalyze}
            disabled={!canAnalyze}
            whileHover={canAnalyze ? { scale: 1.03 } : {}}
            whileTap={canAnalyze  ? { scale: 0.97 } : {}}
            style={{
              fontSize: "0.9375rem",
              padding:  "0.6875rem 1.75rem",
              position: "relative",
              minWidth: "140px",
            }}
            aria-label="Analyze vibe"
          >
            {!loading && (
              <>
                <motion.span
                  animate={canAnalyze ? { rotate: [0, 15, -10, 0] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                  style={{ display: "inline-block" }}
                >
                  ⚡
                </motion.span>
                {" "}Check the Vibe
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Insufficient length warning ────────────────────────────────── */}
      <AnimatePresence>
        {text.length > 0 && text.trim().length < MIN_CHARS && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--accent-amber)",
              marginTop: "0.625rem",
              letterSpacing: "0.04em",
            }}
          >
            ⚠ Need at least {MIN_CHARS} characters to analyze.
          </motion.p>
        )}
      </AnimatePresence>

    </motion.div>
  );
}