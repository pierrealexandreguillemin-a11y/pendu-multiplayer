/**
 * PvP Effects Hook - Delegates to shared multiplayer effects.
 */

import { useMemo } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import type { LeaderboardEntry } from '@/types/game';
import type { PvPPhase } from './usePvPSession';
import type { PvPPlayer } from './usePvPRoom';
import type { PvPRefs } from './usePvPMessageHandler';
import { useMultiplayerEffects } from '@/features/multiplayer';
import type { MessageHandlerOverrides } from '@/features/multiplayer';

type AddEntryFn = (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => void;

export interface PvPEffectsOptions {
  peer: ReturnType<typeof usePeerConnection>;
  game: ReturnType<typeof useGameLogic>;
  phase: PvPPhase;
  setPhase: (phase: PvPPhase) => void;
  playerName: string;
  sessionScore: number;
  wordsWon: number;
  hasRecordedRef: React.MutableRefObject<boolean>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
  refs: PvPRefs;
  setPlayers: React.Dispatch<React.SetStateAction<PvPPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  advanceTurn: () => void;
  broadcastPlayersUpdate: (playerList?: PvPPlayer[], turnIndex?: number) => void;
  addEntry: AddEntryFn;
}

const PVP_MESSAGE_OVERRIDES: MessageHandlerOverrides = {
  logPrefix: 'PvP',
  onRestart: (_refs, actions) => {
    if (!actions.isHost) actions.setPhase('waiting');
  },
  turnChangeRequiresNonHost: true,
};

export function usePvPEffects(opts: PvPEffectsOptions) {
  const messageOverrides = useMemo(() => PVP_MESSAGE_OVERRIDES, []);

  useMultiplayerEffects({
    ...opts,
    setPhase: opts.setPhase as (phase: string) => void,
    messageOverrides,
    defaultCategory: 'PvP',
    leaderboardMode: 'pvp',
    recordOnlyNonHost: true,
  });
}
