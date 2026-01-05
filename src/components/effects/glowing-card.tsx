'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowingCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  tiltAmount?: number;
  glareOpacity?: number;
}

/**
 * Card with 3D tilt effect and glowing glare on hover
 * Adapted from next-js-boilerplate
 */
export function GlowingCard({
  children,
  className,
  glowColor = 'rgba(74, 222, 128, 0.4)',
  tiltAmount = 8,
  glareOpacity = 0.15,
}: GlowingCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * tiltAmount;
    const tiltY = ((centerX - x) / centerX) * tiltAmount;

    setTilt({ x: tiltX, y: tiltY });
    setGlarePosition({ x, y });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn('relative overflow-hidden rounded-2xl', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* Glare effect */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${glarePosition.x}px ${glarePosition.y}px, ${glowColor}, transparent 50%)`,
        }}
      />
      {/* Glow border on hover */}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? glareOpacity : 0,
          boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px ${glowColor}`,
        }}
      />
      {children}
    </motion.div>
  );
}
