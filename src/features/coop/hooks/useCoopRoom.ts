/**
 * Coop Room Hook - Player roster and turn management
 * Delegates to shared multiplayer room hook.
 */

import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useMultiplayerRoom } from '@/features/multiplayer';
import type { MultiplayerPlayer, MultiplayerRoomState } from '@/features/multiplayer';

export type CoopPlayer = MultiplayerPlayer;
export type CoopRoomState = MultiplayerRoomState;

export function useCoopRoom(peer: ReturnType<typeof usePeerConnection>): CoopRoomState {
  return useMultiplayerRoom(peer);
}
