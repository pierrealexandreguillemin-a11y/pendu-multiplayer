/**
 * Multiplayer Feature - Shared code for coop and pvp modes
 */

export type { MultiplayerPlayer, GameMode } from './types';
export { useMultiplayerRoom, type MultiplayerRoomState } from './hooks/useMultiplayerRoom';
export {
  buildMultiplayerMessageHandler,
  type MultiplayerRefs,
  type MultiplayerActions,
  type MessageHandlerOverrides,
} from './hooks/useMultiplayerMessageHandler';
export {
  useMultiplayerEffects,
  type MultiplayerEffectsOptions,
} from './hooks/useMultiplayerEffects';
export { useMultiplayerCallbacks } from './hooks/useMultiplayerCallbacks';
export { MultiplayerLobby } from './components/MultiplayerLobby';
export { MultiplayerWaiting } from './components/MultiplayerWaiting';
