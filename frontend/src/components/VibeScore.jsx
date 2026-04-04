import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

// ─── Vibe Level Config ────────────────────────────────────────────────────────

const VIBE_CONFIG = {
  toxic: {
    label:       "TOXIC",
    emoji:       "☠️",
    color:       "#ef4444",
    colorRgb:    "239, 68, 68",
    trackColor:  "rgba(239, 68, 68, 0.12)",
    gradient:    ["#ef4444", "#dc2626"],
    description: "Abusive, threatening, or manipulative language detected.",
    pulse:       true,
  },
  low: {
    label:       "LOW VIBE",
    emoji:       "🥶",
    color:       "#f97316",
    colorRgb:    "249, 115, 22",
    trackColor:  "rgba(249, 115, 22, 0.12)",
    gradient:    ["#f97316", "#ea580c"],
    description: "Cold, passive-aggressive, or pressuring undertones.",
    pulse:       true,
  },
  neutral: {
    label:       "NEUTRAL",
    emoji:       "😐",
    color:       "#eab308",
    colorRgb:    "234, 179, 8",
    trackColor:  "rgba(234, 179, 8, 0.12)",
    gradient:    ["#eab308", "#ca8a04"],
    description: "Flat, transactional, or ambiguous in intent.",
    pulse:       false,
  },
  warm: {
    label:       "WARM",
    emoji:       "🌊",
    color:       "#3b82f6",
    colorRgb:    "59, 130, 246",
    trackColor:  "rgba(59, 130, 246, 0.12)",
    gradient:    ["#3b82f6", "#6366f1"],
    description: "Friendly, open, and constructive communication.",
    pulse:       false,
  },
  positive: {
    label:       "POSITIVE",
    emoji:       "✨",
    color:       "#10b981",
    colorRgb:    "16, 185, 129",
    trackColor:  "rgba(16, 185, 129, 0.12)",
    gradient:    ["#10b981", "#06b6d4"],
    description: "Genuine, warm, and emotionally healthy.",
    pulse:       false,
  },
};

// ─── SVG Ring constants ───────────────────────────────────────────────────────

const RADIUS       = 88;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER        = 110;
const VIEWBOX_SIZE  = CENTER * 2;

// ─── Animated counter hook ────────────────────────────────────────────────────

function useAnimatedCounter(target, duration = 1.2) {
  const motionVal = useMotionValue(0);
  const rounded   = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [target]);

  return display;
}

// ─── Tick marks around the ring ──────────────────────────────────────────────

function RingTicks({ count = 40, activeUpTo, color }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle     = (i / count) * 360 - 90;
        const rad       = (angle * Math.PI) / 180;
        const pct       = i / count;
        const isActive  = pct <= activeUpTo / 100;
        const innerR    = RADIUS + STROKE_WIDTH / 2 + 4;
        const outerR    = innerR + (i % 5 === 0 ? 7 : 4);
        const x1        = CENTER + innerR * Math.cos(rad);
        const y1        = CENTER + innerR * Math.sin(rad);
        const x2        = CENTER + outerR * Math.cos(rad);
        const y2        = CENTER + outerR * Math.sin(rad);

        return (
          <motion.line
            key={i}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke={isActive ? color : "rgba(255,255,255,0.06)"}
            strokeWidth={i % 5 === 0 ? 1.5 : 0.75}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.012, duration: 0.2 }}
          />
        );
      })}
    </>
  );
}

// ─── Confidence arc (thin outer ring) ────────────────────────────────────────

function ConfidenceArc({ confidence, color }) {
  const outerRadius    = RADIUS + STROKE_WIDTH / 2 + 18;
  const circumference  = 2 * Math.PI * outerRadius;
  const offset         = circumference - (confidence / 100) * circumference;

  return (
    <motion.circle
      cx={CENTER}
      cy={CENTER}
      r={outerRadius}
      fill="none"
      stroke={color}
      strokeOpacity={0.25}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray={circumference}
      strokeDashoffset={circumference}
      animate={{ strokeDashoffset: offset }}
      transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ transform: `rotate(-90deg)`, transformOrigin: `${CENTER}px ${CENTER}px` }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VibeScore({ vibe }) {
  const { score, level, confidence } = vibe;
  const config   = VIBE_CONFIG[level] || VIBE_CONFIG.neutral;
  const animScore = useAnimatedCounter(score, 1.2);
  const gradId    = `vibe-grad-${level}`;
  const glowId    = `vibe-glow-${level}`;

  // SVG ring offset
  const offset    = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  // Tooltip for confidence
  const confidenceLabel = confidence >= 85 ? "High confidence"
    : confidence >= 65 ? "Medium confidence"
    : "Low confidence";

  return (
    <motion.div
      className="card-glow"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            "1.25rem",
        padding:        "1.75rem 1.25rem",
        position:       "relative",
        overflow:       "hidden",
        background:     config.trackColor,
      }}
    >

      {/* ── Background glow orb ─────────────────────────────────────── */}
      <div style={{
        position:     "absolute",
        top:          "50%",
        left:         "50%",
        transform:    "translate(-50%, -50%)",
        width:        "200px",
        height:       "200px",
        borderRadius: "50%",
        background:   `radial-gradient(circle, rgba(${config.colorRgb}, 0.12) 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex:        0,
      }} />

      {/* ── Section label ───────────────────────────────────────────── */}
      <p className="heading-sm" style={{ zIndex: 1 }}>VIBE SCORE</p>

      {/* ── SVG Ring ────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Pulse rings for toxic/low */}
        <AnimatePresence>
          {config.pulse && (
            <>
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    position:     "absolute",
                    inset:        0,
                    borderRadius: "50%",
                    border:       `1.5px solid ${config.color}`,
                    opacity:      0,
                  }}
                  animate={{
                    scale:   [1, 1.25 + i * 0.12],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration:   1.8,
                    repeat:     Infinity,
                    delay:      i * 0.7,
                    ease:       "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <svg
          width={VIEWBOX_SIZE}
          height={VIEWBOX_SIZE}
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Main ring gradient */}
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={config.gradient[0]} />
              <stop offset="100%" stopColor={config.gradient[1]} />
            </linearGradient>

            {/* Glow filter */}
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track ring */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={STROKE_WIDTH}
          />

          {/* Tick marks */}
          <RingTicks count={40} activeUpTo={animScore} color={config.color} />

          {/* Confidence outer arc */}
          <ConfidenceArc confidence={confidence} color={config.color} />

          {/* Main score arc */}
          <motion.circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            filter={`url(#${glowId})`}
            style={{
              transform:       `rotate(-90deg)`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
            }}
          />

          {/* Endpoint dot */}
          {score > 2 && (() => {
            const angle = (score / 100) * 360 - 90;
            const rad   = (angle * Math.PI) / 180;
            const dotX  = CENTER + RADIUS * Math.cos(rad);
            const dotY  = CENTER + RADIUS * Math.sin(rad);
            return (
              <motion.circle
                cx={dotX} cy={dotY} r={5}
                fill={config.color}
                filter={`url(#${glowId})`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, duration: 0.3, ease: "backOut" }}
              />
            );
          })()}
        </svg>

        {/* ── Center content ─────────────────────────────────────────── */}
        <div style={{
          position:  "absolute",
          inset:     0,
          display:   "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap:       "0.2rem",
        }}>
          {/* Score number */}
          <motion.span
            style={{
              fontFamily:   "var(--font-display)",
              fontSize:     "3.25rem",
              fontWeight:   800,
              letterSpacing: "-0.05em",
              lineHeight:   1,
              color:        config.color,
              filter:       `drop-shadow(0 0 16px rgba(${config.colorRgb}, 0.5))`,
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {animScore}
          </motion.span>

          {/* /100 label */}
          <span style={{
            fontFamily:   "var(--font-mono)",
            fontSize:     "0.625rem",
            fontWeight:   600,
            letterSpacing: "0.1em",
            color:        "var(--text-muted)",
            textTransform: "uppercase",
          }}>
            / 100
          </span>

          {/* Emoji */}
          <motion.span
            style={{ fontSize: "1.1rem", lineHeight: 1 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            {config.emoji}
          </motion.span>
        </div>
      </div>

      {/* ── Level badge ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        style={{ zIndex: 1 }}
      >
        <span className={`vibe-badge ${level}`}>
          {config.label}
        </span>
      </motion.div>

      {/* ── Description ─────────────────────────────────────────────── */}
      <motion.p
        className="body-text"
        style={{
          fontSize:  "0.8rem",
          textAlign: "center",
          lineHeight: 1.5,
          zIndex:    1,
          maxWidth:  "200px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        {config.description}
      </motion.p>

      <hr className="vibe-divider" style={{ width: "100%", zIndex: 1 }} />

      {/* ── Confidence meter ─────────────────────────────────────────── */}
      <motion.div
        style={{ width: "100%", zIndex: 1 }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.35 }}
      >
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          marginBottom:   "0.5rem",
        }}>
          <span className="heading-sm" style={{ letterSpacing: "0.06em" }}>
            CONFIDENCE
          </span>
          <span style={{
            fontFamily:   "var(--font-mono)",
            fontSize:     "0.6875rem",
            fontWeight:   700,
            color:        config.color,
          }}>
            {confidence}% · {confidenceLabel}
          </span>
        </div>

        <div className="progress-track">
          <motion.div
            style={{
              height:       "100%",
              borderRadius: "999px",
              background:   `linear-gradient(90deg, ${config.gradient[0]}, ${config.gradient[1]})`,
              originX:      0,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: confidence / 100 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      {/* ── Score interpretation row ─────────────────────────────────── */}
      <motion.div
        style={{
          display:      "flex",
          gap:          "0.5rem",
          width:        "100%",
          zIndex:       1,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        {[
          { range: "0–20",   label: "toxic",    active: score <= 20 },
          { range: "21–40",  label: "low",      active: score > 20 && score <= 40 },
          { range: "41–60",  label: "neutral",  active: score > 40 && score <= 60 },
          { range: "61–80",  label: "warm",     active: score > 60 && score <= 80 },
          { range: "81–100", label: "positive", active: score > 80 },
        ].map(({ range, label, active }) => (
          <div
            key={label}
            style={{
              flex:          1,
              height:        "3px",
              borderRadius:  "999px",
              background:    active
                ? VIBE_CONFIG[label].color
                : "var(--bg-overlay)",
              transition:    "background 0.3s ease",
            }}
            title={`${label}: ${range}`}
          />
        ))}
      </motion.div>

    </motion.div>
  );
}