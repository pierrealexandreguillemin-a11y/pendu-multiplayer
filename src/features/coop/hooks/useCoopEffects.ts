/**
 * Coop Effects Hook - Side effects for Coop session (message handling, leaderboard)
 */

import { useEffect } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import type { LeaderboardEntry } from '@/types/game';
import type { CoopPhase } from './useCoopSession';
import type { CoopPlayer } from './useCoopRoom';
import type { CoopRefs, CoopActions } from './useCoopMessageHandler';
import { buildCoopMessageHandler } from './useCoopMessageHandler';

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

export function useCoopEffects(opts: CoopEffectsOptions) {
  const {
    peer,
    game,
    phase,
    setPhase,
    playerName,
    sessionScore,
    wordsWon,
    hasRecordedRef,
    startBroadcastSentRef,
    refs,
    setPlayers,
    setCurrentTurnIndex,
    advanceTurn,
    broadcastPlayersUpdate,
    addEntry,
  } = opts;

  useEffect(() => {
    if (!startBroadcastSentRef.current && peer.isHost && game.gameState && phase === 'playing') {
      peer.sendMessage({
        type: 'start',
        payload: { word: game.gameState.word, category: game.gameState.category ?? '' },
      });
      startBroadcastSentRef.current = true;
    }
  }, [peer, game.gameState, phase, startBroadcastSentRef]);

  useEffect(() => {
    if (game.gameState?.status === 'lost' && playerName && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: 'coop',
        score: sessionScore,
        word: `${wordsWon} mots`,
        errors: game.gameState.errors,
        maxErrors: game.gameState.maxErrors,
        won: false,
      });
    }
  }, [
    game.gameState?.status,
    game.gameState?.errors,
    game.gameState?.maxErrors,
    playerName,
    sessionScore,
    wordsWon,
    addEntry,
    hasRecordedRef,
  ]);

  useEffect(() => {
    const actions: CoopActions = {
      isHost: peer.isHost,
      sendMessage: peer.sendMessage,
      setPhase,
      setPlayers,
      setCurrentTurnIndex,
      advanceTurn,
      broadcastPlayersUpdate,
    };
    peer.onMessage(buildCoopMessageHandler(refs, actions));
    return () => {
      peer.offMessage();
    };
  }, [peer, setPhase, setPlayers, setCurrentTurnIndex, advanceTurn, broadcastPlayersUpdate, refs]);
}
