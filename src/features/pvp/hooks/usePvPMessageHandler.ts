/**
 * PvP Message Handler - Delegates to shared multiplayer message handler.
 */

import type { GameMessage } from '@/types/game';
import type {
  MultiplayerRefs,
  MultiplayerActions,
  MessageHandlerOverrides,
} from '@/features/multiplayer';
import { buildMultiplayerMessageHandler } from '@/features/multiplayer';

export type PvPRefs = MultiplayerRefs;
export type PvPActions = MultiplayerActions;

const PVP_OVERRIDES: MessageHandlerOverrides = {
  logPrefix: 'PvP',
  onRestart: (_refs, actions) => {
    if (!actions.isHost) actions.setPhase('waiting');
  },
  turnChangeRequiresNonHost: true,
};

export function buildPvPMessageHandler(refs: PvPRefs, actions: PvPActions) {
  return buildMultiplayerMessageHandler(refs, actions, PVP_OVERRIDES) as (
    message: GameMessage
  ) => void;
}
