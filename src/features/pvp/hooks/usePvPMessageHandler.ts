/**
 * PvP Message Handler Types
 *
 * Re-exports multiplayer types with PvP-specific names for clarity.
 * Overrides are defined in usePvPEffects.ts where they're consumed.
 */

import type { MultiplayerRefs } from '@/features/multiplayer';

export type PvPRefs = MultiplayerRefs;
