import { motion, AnimatePresence } from "framer-motion";

// ─── Emotion Config ───────────────────────────────────────────────────────────

const EMOTION_CONFIG = {
  joy:          { emoji: "😄", color: "#f59e0b", rgb: "245, 158, 11",  label: "Joy"          },
  anger:        { emoji: "😤", color: "#ef4444", rgb: "239, 68, 68",   label: "Anger"        },
  sadness:      { emoji: "😔", color: "#6366f1", rgb: "99, 102, 241",  label: "Sadness"      },
  fear:         { emoji: "😨", color: "#8b5cf6", rgb: "139, 92, 246",  label: "Fear"         },
  disgust:      { emoji: "🤢", color: "#10b981", rgb: "16, 185, 129",  label: "Disgust"      },
  surprise:     { emoji: "😲", color: "#06b6d4", rgb: "6, 182, 212",   label: "Surprise"     },
  anticipation: { emoji: "🤔", color: "#f97316", rgb: "249, 115, 22",  label: "Anticipation" },
  trust:        { emoji: "🤝", color: "#3b82f6", rgb: "59, 130, 246",  label: "Trust"        },
  neutral:      { emoji: "😐", color: "#9090b0", rgb: "144, 144, 176", label: "Neutral"      },
};

const INTENT_CONFIG = {
  inform:     { emoji: "📢", color: "#06b6d4", label: "Inform"     },
  persuade:   { emoji: "🎯", color: "#f59e0b", label: "Persuade"   },
  request:    { emoji: "🙏", color: "#3b82f6", label: "Request"    },
  vent:       { emoji: "💢", color: "#ef4444", label: "Vent"       },
  threaten:   { emoji: "⚠️",  color: "#ef4444", label: "Threaten"  },
  compliment: { emoji: "💝", color: "#10b981", label: "Compliment" },
  complain:   { emoji: "😤", color: "#f97316", label: "Complain"   },
  deflect:    { emoji: "🪃", color: "#8b5cf6", label: "Deflect"    },
  manipulate: { emoji: "🎭", color: "#ec4899", label: "Manipulate" },
  unclear:    { emoji: "❓", color: "#9090b0", label: "Unclear"    },
};

// ─── Animated intensity bar ───────────────────────────────────────────────────

function IntensityBar({ value, color, delay = 0 }) {
  return (
    <div className="progress-track" style={{ height: "8px" }}>
      <motion.div
        style={{
          height:       "100%",
          borderRadius: "999px",
          background:   `linear-gradient(90deg, ${color}, ${color}99)`,
          originX:      0,
          boxShadow:    `0 0 8px ${color}55`,
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: value / 100 }}
        transition={{
          duration: 1,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
    </div>
  );
}

// ─── Tone meter row ───────────────────────────────────────────────────────────

function ToneMeter({ label, value, colorClass, delay }) {
  const pct = `${value}%`;

  // Color based on meter type and value
  const getColor = () => {
    if (colorClass === "aggression") {
      if (value >= 70) return "#ef4444";
      if (value >= 40) return "#f97316";
      return "#10b981";
    }
    if (colorClass === "warmth") {
      if (value >= 70) return "#10b981";
      if (value >= 40) return "#3b82f6";
      return "#9090b0";
    }
    // formality
    if (value >= 70) return "#6366f1";
    if (value >= 40) return "#06b6d4";
    return "#f59e0b";
  };

  const color = getColor();

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        marginBottom:   "0.375rem",
      }}>
        <span style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.6875rem",
          fontWeight:    500,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color:         "var(--text-muted)",
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize:   "0.6875rem",
          fontWeight: 700,
          color,
        }}>
          {value}
        </span>
      </div>
      <IntensityBar value={value} color={color} delay={delay + 0.1} />
    </motion.div>
  );
}

// ─── Emotion bubble ───────────────────────────────────────────────────────────

function EmotionBubble({ emotionKey, size = "primary", delay = 0 }) {
  const cfg    = EMOTION_CONFIG[emotionKey] || EMOTION_CONFIG.neutral;
  const isPrimary = size === "primary";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay,
        duration: 0.45,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      style={{
        display:        "inline-flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            "0.3rem",
      }}
    >
      <div style={{
        width:        isPrimary ? "64px" : "44px",
        height:       isPrimary ? "64px" : "44px",
        borderRadius: "50%",
        background:   `radial-gradient(circle at 35% 35%, rgba(${cfg.rgb}, 0.3), rgba(${cfg.rgb}, 0.08))`,
        border:       `${isPrimary ? 2 : 1.5}px solid rgba(${cfg.rgb}, ${isPrimary ? 0.5 : 0.3})`,
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        fontSize:     isPrimary ? "1.75rem" : "1.125rem",
        boxShadow:    isPrimary
          ? `0 0 20px rgba(${cfg.rgb}, 0.25), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 0 10px rgba(${cfg.rgb}, 0.15)`,
        position:     "relative",
      }}>
        {cfg.emoji}

        {/* Glow ring for primary */}
        {isPrimary && (
          <motion.div
            style={{
              position:     "absolute",
              inset:        "-6px",
              borderRadius: "50%",
              border:       `1px solid rgba(${cfg.rgb}, 0.2)`,
            }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <span style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      isPrimary ? "0.6875rem" : "0.5625rem",
        fontWeight:    600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color:         cfg.color,
      }}>
        {cfg.label}
      </span>
    </motion.div>
  );
}

// ─── Tone tags strip ──────────────────────────────────────────────────────────

function ToneTagsStrip({ tags }) {
  if (!tags?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
      {tags.map((tag, i) => (
        <motion.span
          key={tag}
          className="tone-tag"
          initial={{ opacity: 0, scale: 0.75, y: 6 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          transition={{
            delay:    0.3 + i * 0.07,
            duration: 0.35,
            ease:     [0.34, 1.56, 0.64, 1],
          }}
        >
          {tag}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Intent badge ─────────────────────────────────────────────────────────────

function IntentBadge({ intent, explanation, delay = 0 }) {
  const cfg = INTENT_CONFIG[intent] || INTENT_CONFIG.unclear;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding:      "0.875rem 1rem",
        background:   `rgba(${hexToRgb(cfg.color)}, 0.06)`,
        border:       `1px solid rgba(${hexToRgb(cfg.color)}, 0.2)`,
        borderRadius: "var(--radius-md)",
        borderLeft:   `3px solid ${cfg.color}`,
      }}
    >
      <div style={{
        display:     "flex",
        alignItems:  "center",
        gap:         "0.5rem",
        marginBottom: "0.375rem",
      }}>
        <span style={{ fontSize: "1rem" }}>{cfg.emoji}</span>
        <span style={{
          fontFamily:    "var(--font-display)",
          fontWeight:    700,
          fontSize:      "0.9375rem",
          color:         cfg.color,
          letterSpacing: "-0.01em",
        }}>
          {cfg.label}
        </span>
        <span style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.5625rem",
          fontWeight:    600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color:         "var(--text-muted)",
          marginLeft:    "auto",
        }}>
          INTENT
        </span>
      </div>
      <p className="body-text" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
        {explanation}
      </p>
    </motion.div>
  );
}

// ─── Hex to RGB helper ────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "168, 85, 247";
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function MiniStat({ value, label, delay = 0 }) {
  return (
    <motion.div
      className="stat-chip"
      style={{ flex: 1, textAlign: "center" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="stat-value" style={{ fontSize: "1.25rem" }}>{value}</span>
      <span className="stat-label">{label}</span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmotionBreakdown({
  emotion,
  intent,
  intentExplanation,
  tone,
  wordCount,
}) {
  const primaryCfg   = EMOTION_CONFIG[emotion.primary]   || EMOTION_CONFIG.neutral;
  const secondaryCfg = emotion.secondary
    ? EMOTION_CONFIG[emotion.secondary]
    : null;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >

      {/* ── Section label ───────────────────────────────────────────── */}
      <p className="heading-sm">EMOTION & INTENT</p>

      {/* ── Emotion bubbles ─────────────────────────────────────────── */}
      <div style={{
        display:     "flex",
        alignItems:  "center",
        gap:         "1rem",
      }}>
        <EmotionBubble emotionKey={emotion.primary} size="primary" delay={0.1} />

        {secondaryCfg && (
          <>
            {/* Arrow connector */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              style={{
                display:       "flex",
                flexDirection: "column",
                alignItems:    "center",
                gap:           "0.2rem",
                flex:          1,
              }}
            >
              <div style={{
                height:     "1px",
                width:      "100%",
                background: "linear-gradient(90deg, var(--border-default), transparent)",
              }} />
              <span style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.5rem",
                color:         "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                whiteSpace:    "nowrap",
              }}>
                masked by
              </span>
            </motion.div>

            <EmotionBubble emotionKey={emotion.secondary} size="secondary" delay={0.25} />
          </>
        )}

        {/* Intensity block */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          style={{
            marginLeft:    "auto",
            display:       "flex",
            flexDirection: "column",
            alignItems:    "center",
            gap:           "0.2rem",
          }}
        >
          <span style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "1.75rem",
            fontWeight:    800,
            letterSpacing: "-0.04em",
            lineHeight:    1,
            color:         primaryCfg.color,
            filter:        `drop-shadow(0 0 8px rgba(${primaryCfg.rgb}, 0.4))`,
          }}>
            {emotion.intensity}
          </span>
          <span style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.5625rem",
            fontWeight:    600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color:         "var(--text-muted)",
          }}>
            intensity
          </span>
          {/* Intensity mini-arc */}
          <svg width="36" height="18" viewBox="0 0 36 18">
            <path
              d="M 2 16 A 16 16 0 0 1 34 16"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <motion.path
              d="M 2 16 A 16 16 0 0 1 34 16"
              fill="none"
              stroke={primaryCfg.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="50"
              strokeDashoffset={50 - (emotion.intensity / 100) * 50}
              initial={{ strokeDashoffset: 50 }}
              animate={{ strokeDashoffset: 50 - (emotion.intensity / 100) * 50 }}
              transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        </motion.div>
      </div>

      {/* ── Intensity full bar ───────────────────────────────────────── */}
      <div>
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          marginBottom:   "0.375rem",
        }}>
          <span className="heading-sm">INTENSITY</span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "0.6875rem",
            color:      primaryCfg.color,
            fontWeight: 700,
          }}>
            {emotion.intensity} / 100
          </span>
        </div>
        <IntensityBar value={emotion.intensity} color={primaryCfg.color} delay={0.45} />
      </div>

      <hr className="vibe-divider" />

      {/* ── Intent badge ─────────────────────────────────────────────── */}
      <IntentBadge
        intent={intent}
        explanation={intentExplanation}
        delay={0.5}
      />

      <hr className="vibe-divider" />

      {/* ── Tone profile ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <p className="heading-sm">TONE PROFILE</p>
        <ToneMeter label="Formality"  value={tone.formality}  colorClass="formality"  delay={0.55} />
        <ToneMeter label="Aggression" value={tone.aggression} colorClass="aggression" delay={0.65} />
        <ToneMeter label="Warmth"     value={tone.warmth}     colorClass="warmth"     delay={0.75} />
      </div>

      {/* ── Tone tags ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {tone.tags?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <ToneTagsStrip tags={tone.tags} />
          </motion.div>
        )}
      </AnimatePresence>

      <hr className="vibe-divider" />

      {/* ── Mini stats row ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.625rem" }}>
        <MiniStat
          value={wordCount}
          label="words"
          delay={0.8}
        />
        <MiniStat
          value={`${tone.formality}%`}
          label="formal"
          delay={0.85}
        />
        <MiniStat
          value={`${tone.warmth}%`}
          label="warm"
          delay={0.9}
        />
      </div>

    </motion.div>
  );
}