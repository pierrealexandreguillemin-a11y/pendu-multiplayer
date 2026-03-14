/**
 * Coop Effects Hook - Delegates to shared multiplayer effects.
 */

import { useMemo } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import type { LeaderboardEntry } from '@/types/game';
import type { CoopPhase } from './useCoopSession';
import type { CoopPlayer } from './useCoopRoom';
import type { CoopRefs } from './useCoopMessageHandler';
import { useMultiplayerEffects } from '@/features/multiplayer';
import type { MessageHandlerOverrides } from '@/features/multiplayer';

type AddEntryFn = (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => void;

export interface CoopEffectsOptions {
  peer: ReturnType<typeof usePeerConnection>;
  game: ReturnType<typeof useGameLogic>;
  phase: CoopPhase;
  setPhase: (phase: CoopPhase) => void;
  playerName: string;
  sessionScore: number;
  wordsWon: number;
  hasRecordedRef: React.MutableRefObject<boolean>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
  refs: CoopRefs;
  setPlayers: React.Dispatch<React.SetStateAction<CoopPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  advanceTurn: () => void;
  broadcastPlayersUpdate: (playerList?: CoopPlayer[], turnIndex?: number) => void;
  addEntry: AddEntryFn;
}

const COOP_MESSAGE_OVERRIDES: MessageHandlerOverrides = {
  logPrefix: 'Coop',
  onRestart: (refs, actions) => {
    refs.gameRef.current.startGame();
    actions.setPhase('playing');
  },
  turnChangeRequiresNonHost: false,
};

export function useCoopEffects(opts: CoopEffectsOptions) {
  const messageOverrides = useMemo(() => COOP_MESSAGE_OVERRIDES, []);

  useMultiplayerEffects({
    ...opts,
    setPhase: opts.setPhase as (phase: string) => void,
    messageOverrides,
    defaultCategory: '',
    leaderboardMode: 'coop',
    recordOnlyNonHost: false,
  });
}
