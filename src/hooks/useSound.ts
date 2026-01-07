/**
 * Sound Hook - Audio playback for game events
 * APPLICATION LAYER (ISO/IEC 42010)
 *
 * Uses Web Audio API for low-latency playback
 * Respects prefers-reduced-motion and user preferences
 * Sound files from Kenney (CC0 license)
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Available sound types */
export type SoundType =
  | 'correct' // Correct letter guess
  | 'incorrect' // Wrong letter guess
  | 'victory' // Game won
  | 'defeat' // Game lost
  | 'click' // UI interactions
  | 'record'; // New high score / badge unlock

/** Sound file mapping */
const SOUND_FILES: Record<SoundType, string> = {
  correct: '/sounds/magic-ding.ogg',
  incorrect: '/sounds/soft-oops.ogg',
  victory: '/sounds/level-up.ogg',
  defeat: '/sounds/soft-oops.ogg', // Reuse for now
  click: '/sounds/click.ogg',
  record: '/sounds/badge-unlock.ogg',
};

/** Safe localStorage wrapper for SSR compatibility */
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
    } catch {
      // Ignore
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore
    }
  },
};

/** Sound settings store */
interface SoundSettingsState {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggle: () => void;
}

export const useSoundSettings = create<SoundSettingsState>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.5,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: 'pendu-sound-settings',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

/**
 * Hook for playing game sounds
 *
 * @example
 * const { play } = useSound();
 * play('correct'); // Play correct sound
 */
export function useSound() {
  const { enabled, volume } = useSoundSettings();
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<SoundType, AudioBuffer>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if user prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Safe SSR check - only access window on client
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Initialize AudioContext on user interaction
  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) return audioContextRef.current;
    if (typeof window === 'undefined') return null;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Preload all sounds
      await Promise.all(
        (Object.entries(SOUND_FILES) as [SoundType, string][]).map(async ([type, url]) => {
          try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            audioBuffersRef.current.set(type, audioBuffer);
          } catch (err) {
            console.warn(`[Sound] Failed to load ${type}:`, err);
          }
        })
      );

      setIsLoaded(true);
      return ctx;
    } catch (err) {
      console.warn('[Sound] AudioContext not supported:', err);
      return null;
    }
  }, []);

  // Play a sound
  const play = useCallback(
    async (type: SoundType) => {
      // Don't play if disabled or prefers-reduced-motion
      if (!enabled || prefersReducedMotion) return;

      // Ensure AudioContext is initialized
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = await initAudioContext();
        if (!ctx) return;
      }

      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Get buffer for this sound
      const buffer = audioBuffersRef.current.get(type);
      if (!buffer) {
        // Fallback: try to load now
        await initAudioContext();
        const retryBuffer = audioBuffersRef.current.get(type);
        if (!retryBuffer) return;
      }

      try {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffersRef.current.get(type)!;

        // Create gain node for volume control
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
      } catch (err) {
        console.warn(`[Sound] Failed to play ${type}:`, err);
      }
    },
    [enabled, prefersReducedMotion, volume, initAudioContext]
  );

  // Preload sounds on mount (requires user interaction first)
  useEffect(() => {
    const handleInteraction = () => {
      initAudioContext();
      // Remove listeners after first interaction
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [initAudioContext]);

  return {
    play,
    isLoaded,
    enabled,
    prefersReducedMotion,
  };
}
