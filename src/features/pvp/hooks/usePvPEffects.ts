/**
 * PvP Effects Hook - Side effects for PvP session (message handling, leaderboard)
 */

import { useEffect } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import type { LeaderboardEntry } from '@/types/game';
import type { PvPPhase } from './usePvPSession';
import type { PvPPlayer } from './usePvPRoom';
import type { PvPRefs, PvPActions } from './usePvPMessageHandler';
import { buildPvPMessageHandler } from './usePvPMessageHandler';

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

export function usePvPEffects(opts: PvPEffectsOptions) {
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
        payload: { word: game.gameState.word, category: game.gameState.category ?? 'PvP' },
      });
      startBroadcastSentRef.current = true;
    }
  }, [peer, game.gameState, phase, startBroadcastSentRef]);

  useEffect(() => {
    if (
      game.gameState?.status === 'lost' &&
      !peer.isHost &&
      playerName &&
      !hasRecordedRef.current
    ) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: 'pvp',
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
    peer.isHost,
    playerName,
    sessionScore,
    wordsWon,
    addEntry,
    hasRecordedRef,
  ]);

  useEffect(() => {
    const actions: PvPActions = {
      isHost: peer.isHost,
      sendMessage: peer.sendMessage,
      setPhase,
      setPlayers,
      setCurrentTurnIndex,
      advanceTurn,
      broadcastPlayersUpdate,
    };
    peer.onMessage(buildPvPMessageHandler(refs, actions));
    return () => {
      peer.offMessage();
    };
  }, [peer, setPhase, setPlayers, setCurrentTurnIndex, advanceTurn, broadcastPlayersUpdate, refs]);
}
