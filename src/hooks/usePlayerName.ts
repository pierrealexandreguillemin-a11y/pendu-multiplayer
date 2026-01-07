/**
 * Player Name Hook - Auto-fill from localStorage
 * ISO/IEC 25010 - Usability: Remember user preferences
 *
 * Simple localStorage persistence for personal devices
 * No authentication needed - just convenience
 */

'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'pendu-player-name';

/**
 * Safe localStorage read
 */
function getStoredName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * Safe localStorage write
 */
function setStoredName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (name.trim()) {
      localStorage.setItem(STORAGE_KEY, name.trim());
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Subscribe to storage changes (for useSyncExternalStore)
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

/**
 * Server snapshot (returns empty string)
 */
function getServerSnapshot(): string {
  return '';
}

/**
 * Hook for player name with auto-persistence
 * Uses useSyncExternalStore for proper hydration
 *
 * @returns [playerName, setPlayerName] - like useState but persisted
 */
export function usePlayerName(): [string, (name: string) => void] {
  // Get initial value from localStorage (handles hydration correctly)
  const storedName = useSyncExternalStore(subscribe, getStoredName, getServerSnapshot);

  // Local state for immediate UI updates
  const [name, setName] = useState(storedName);

  // Update function that syncs to localStorage
  const updateName = useCallback((newName: string) => {
    setName(newName);
    if (newName.trim()) {
      setStoredName(newName);
    }
  }, []);

  // Return stored name if local is empty (initial load)
  const displayName = name || storedName;

  return [displayName, updateName];
}

/**
 * Get the stored player name (for non-hook usage)
 */
export function getPlayerName(): string {
  return getStoredName();
}
