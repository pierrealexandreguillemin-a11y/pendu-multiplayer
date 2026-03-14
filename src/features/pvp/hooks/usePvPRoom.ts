/**
 * PvP Room Hook - Player roster and turn management
 * Delegates to shared multiplayer room hook with guesser-only turn filter.
 */

import { useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useMultiplayerRoom } from '@/features/multiplayer';
import type { MultiplayerPlayer, MultiplayerRoomState } from '@/features/multiplayer';

export type PvPPlayer = MultiplayerPlayer;
export type PvPRoomState = MultiplayerRoomState;

export function usePvPRoom(peer: ReturnType<typeof usePeerConnection>): PvPRoomState {
  const turnFilter = useCallback((p: MultiplayerPlayer) => !p.isHost, []);
  return useMultiplayerRoom(peer, { turnFilter });
}
