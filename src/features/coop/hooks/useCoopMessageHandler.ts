/**
 * Coop Message Handler Types
 *
 * Re-exports multiplayer types with coop-specific names for clarity.
 * Overrides are defined in useCoopEffects.ts where they're consumed.
 */

import type { MultiplayerRefs } from '@/features/multiplayer';

export type CoopRefs = MultiplayerRefs;
