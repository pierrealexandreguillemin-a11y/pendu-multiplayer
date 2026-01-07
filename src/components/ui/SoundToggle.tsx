/**
 * Sound Toggle Component - UI for sound settings
 * PRESENTATION LAYER (ISO/IEC 42010)
 *
 * ISO/IEC 25065 - Usability: Clear visual feedback for sound state
 * WCAG 2.1 AA - Accessible toggle with proper ARIA attributes
 */

'use client';

import { useSoundSettings } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';

interface SoundToggleProps {
  /** Additional CSS classes */
  className?: string;
  /** Show volume label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Toggle button for sound on/off
 * Uses Zustand store for persistence
 */
export function SoundToggle({
  className = '',
  showLabel = false,
  size = 'default',
}: SoundToggleProps) {
  const { enabled, toggle } = useSoundSettings();

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      onClick={toggle}
      className={`${className} gap-2`}
      aria-label={enabled ? 'Désactiver le son' : 'Activer le son'}
      aria-pressed={enabled}
    >
      {enabled ? <SoundOnIcon className={iconSize} /> : <SoundOffIcon className={iconSize} />}
      {showLabel && <span className="text-sm">{enabled ? 'Son activé' : 'Son désactivé'}</span>}
    </Button>
  );
}

/** Sound on icon (speaker with waves) */
function SoundOnIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

/** Sound off icon (speaker with X) */
function SoundOffIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

/**
 * Volume slider component (optional enhancement)
 */
export function VolumeSlider({ className = '' }: { className?: string }) {
  const { volume, setVolume, enabled } = useSoundSettings();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SoundToggle size="sm" />
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(volume * 100)}
        onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
        disabled={!enabled}
        className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
        aria-label="Volume"
      />
      <span className="text-xs text-gray-400 w-8">{Math.round(volume * 100)}%</span>
    </div>
  );
}
