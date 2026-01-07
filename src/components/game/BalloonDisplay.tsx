/**
 * Balloon Display - Visual feedback for errors
 * Replaces HangmanDrawing with friendly balloon animations
 *
 * ISO/IEC 25010 - Usability: Child-friendly visual feedback
 * Uses Framer Motion for smooth pop animations
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MAX_ERRORS } from '@/types/game';

/** Pre-generate random delays for balloon animations (outside component) */
const BALLOON_ANIMATION_DELAYS = Array.from({ length: 10 }, (_, i) => 2 + i * 0.05);

interface BalloonDisplayProps {
  /** Current number of errors (0 to maxErrors) */
  errors: number;
  /** Maximum errors allowed (from difficulty) */
  maxErrors?: number;
}

/** Balloon colors - vibrant and friendly */
const BALLOON_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#FFB347', // Orange
  '#87CEEB', // Sky blue
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

/** Get balloon positions based on total count */
function getBalloonPositions(count: number): { x: number; y: number }[] {
  // Arrange balloons in a nice pattern
  const positions: { x: number; y: number }[] = [];

  if (count <= 3) {
    // Single row
    const startX = 100 - (count - 1) * 35;
    for (let i = 0; i < count; i++) {
      positions.push({ x: startX + i * 70, y: 100 });
    }
  } else if (count <= 6) {
    // Two rows
    const topCount = Math.ceil(count / 2);
    const bottomCount = count - topCount;

    const topStartX = 100 - (topCount - 1) * 35;
    for (let i = 0; i < topCount; i++) {
      positions.push({ x: topStartX + i * 70, y: 70 });
    }

    const bottomStartX = 100 - (bottomCount - 1) * 35;
    for (let i = 0; i < bottomCount; i++) {
      positions.push({ x: bottomStartX + i * 70, y: 140 });
    }
  } else {
    // Three rows for 7-10 balloons
    const row1 = Math.min(4, Math.ceil(count / 3));
    const row2 = Math.min(4, Math.ceil((count - row1) / 2));
    const row3 = count - row1 - row2;

    const row1StartX = 100 - (row1 - 1) * 30;
    for (let i = 0; i < row1; i++) {
      positions.push({ x: row1StartX + i * 60, y: 50 });
    }

    const row2StartX = 100 - (row2 - 1) * 30;
    for (let i = 0; i < row2; i++) {
      positions.push({ x: row2StartX + i * 60, y: 110 });
    }

    if (row3 > 0) {
      const row3StartX = 100 - (row3 - 1) * 30;
      for (let i = 0; i < row3; i++) {
        positions.push({ x: row3StartX + i * 60, y: 170 });
      }
    }
  }

  return positions;
}

/** SVG Balloon shape */
function BalloonSVG({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52">
      {/* Balloon body */}
      <ellipse
        cx="20"
        cy="18"
        rx="18"
        ry="18"
        fill={color}
        style={{ filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.2))' }}
      />
      {/* Balloon highlight */}
      <ellipse cx="14" cy="12" rx="5" ry="6" fill="rgba(255,255,255,0.3)" />
      {/* Balloon knot */}
      <polygon points="20,36 16,40 24,40" fill={color} />
      {/* String */}
      <path d="M20,40 Q22,46 18,52" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/**
 * Balloon Display Component
 * Shows balloons that pop as errors increase
 */
export function BalloonDisplay({ errors, maxErrors = MAX_ERRORS }: BalloonDisplayProps) {
  const clampedErrors = Math.min(Math.max(0, errors), maxErrors);
  const balloonsRemaining = maxErrors - clampedErrors;
  const positions = getBalloonPositions(maxErrors);

  // Use pre-generated delays (deterministic, no Math.random during render)
  const animationDelays = BALLOON_ANIMATION_DELAYS;

  return (
    <div
      className="relative w-full max-w-[200px] h-[220px] mx-auto"
      role="img"
      aria-label={`${balloonsRemaining} ballon${balloonsRemaining !== 1 ? 's' : ''} restant${balloonsRemaining !== 1 ? 's' : ''} sur ${maxErrors}`}
    >
      <svg viewBox="0 0 200 220" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <AnimatePresence mode="popLayout">
          {positions.map((pos, index) => {
            // Show balloon if index is >= errors (balloon hasn't popped yet)
            const isVisible = index >= clampedErrors;
            const color = BALLOON_COLORS[index % BALLOON_COLORS.length] ?? '#FF6B6B';

            return (
              <motion.g
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  isVisible
                    ? {
                        scale: 1,
                        opacity: 1,
                        y: [0, -5, 0],
                        transition: {
                          scale: { duration: 0.3, ease: 'easeOut' },
                          opacity: { duration: 0.3 },
                          y: {
                            duration: animationDelays[index] ?? 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          },
                        },
                      }
                    : {}
                }
                exit={{
                  scale: [1, 1.4, 0],
                  opacity: [1, 1, 0],
                  transition: { duration: 0.4, ease: 'easeOut' },
                }}
                style={{
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                }}
              >
                {isVisible && (
                  <foreignObject x={pos.x - 20} y={pos.y - 26} width="40" height="52">
                    <BalloonSVG color={color} />
                  </foreignObject>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* "POP!" indicators for popped balloons */}
        {clampedErrors > 0 && (
          <motion.text
            x="100"
            y="200"
            textAnchor="middle"
            className="text-xs fill-red-400/60 font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {clampedErrors} POP!
          </motion.text>
        )}
      </svg>
    </div>
  );
}
