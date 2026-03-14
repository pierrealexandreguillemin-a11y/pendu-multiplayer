/**
 * Coop Message Handler - Delegates to shared multiplayer message handler.
 */

import type { GameMessage } from '@/types/game';
import type {
  MultiplayerRefs,
  MultiplayerActions,
  MessageHandlerOverrides,
} from '@/features/multiplayer';
import { buildMultiplayerMessageHandler } from '@/features/multiplayer';

export type CoopRefs = MultiplayerRefs;
export type CoopActions = MultiplayerActions;

const COOP_OVERRIDES: MessageHandlerOverrides = {
  logPrefix: 'Coop',
  onRestart: (refs, actions) => {
    refs.gameRef.current.startGame();
    actions.setPhase('playing');
  },
  turnChangeRequiresNonHost: false,
};

export function buildCoopMessageHandler(refs: CoopRefs, actions: CoopActions) {
  return buildMultiplayerMessageHandler(refs, actions, COOP_OVERRIDES) as (
    message: GameMessage
  ) => void;
}
