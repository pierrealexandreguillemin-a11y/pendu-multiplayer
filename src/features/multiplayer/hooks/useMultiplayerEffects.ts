/**
 * Multiplayer Effects Hook - Side effects for multiplayer session (message handling, leaderboard)
 * Shared between coop and pvp modes.
 */

import { useEffect } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import type { LeaderboardEntry } from '@/types/game';
import type { MultiplayerPlayer } from '../types';
import type {
  MultiplayerRefs,
  MultiplayerActions,
  MessageHandlerOverrides,
} from './useMultiplayerMessageHandler';
import { buildMultiplayerMessageHandler } from './useMultiplayerMessageHandler';

type AddEntryFn = (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => void;

export interface MultiplayerEffectsOptions {
  peer: ReturnType<typeof usePeerConnection>;
  game: ReturnType<typeof useGameLogic>;
  phase: string;
  setPhase: (phase: string) => void;
  playerName: string;
  sessionScore: number;
  wordsWon: number;
  hasRecordedRef: React.MutableRefObject<boolean>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
  refs: MultiplayerRefs;
  setPlayers: React.Dispatch<React.SetStateAction<MultiplayerPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  advanceTurn: () => void;
  broadcastPlayersUpdate: (playerList?: MultiplayerPlayer[], turnIndex?: number) => void;
  addEntry: AddEntryFn;
  /** Mode-specific overrides for the message handler */
  messageOverrides: MessageHandlerOverrides;
  /** Default category for start broadcast (coop: '', pvp: 'PvP') */
  defaultCategory: string;
  /** Mode for leaderboard entry ('coop' | 'pvp') */
  leaderboardMode: 'coop' | 'pvp';
  /** Whether leaderboard recording requires non-host (pvp) or any player (coop) */
  recordOnlyNonHost?: boolean;
}

export function useMultiplayerEffects(opts: MultiplayerEffectsOptions) {
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
    messageOverrides,
    defaultCategory,
    leaderboardMode,
    recordOnlyNonHost = false,
  } = opts;

  useEffect(() => {
    if (!startBroadcastSentRef.current && peer.isHost && game.gameState && phase === 'playing') {
      peer.sendMessage({
        type: 'start',
        payload: {
          word: game.gameState.word,
          category: game.gameState.category ?? defaultCategory,
        },
      });
      startBroadcastSentRef.current = true;
    }
  }, [peer, game.gameState, phase, startBroadcastSentRef, defaultCategory]);

  useEffect(() => {
    const canRecord = recordOnlyNonHost ? !peer.isHost : true;
    if (game.gameState?.status === 'lost' && canRecord && playerName && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: leaderboardMode,
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
    leaderboardMode,
    recordOnlyNonHost,
  ]);

  useEffect(() => {
    const actions: MultiplayerActions = {
      isHost: peer.isHost,
      sendMessage: peer.sendMessage,
      setPhase,
      setPlayers,
      setCurrentTurnIndex,
      advanceTurn,
      broadcastPlayersUpdate,
    };
    peer.onMessage(buildMultiplayerMessageHandler(refs, actions, messageOverrides));
    return () => {
      peer.offMessage();
    };
  }, [
    peer,
    setPhase,
    setPlayers,
    setCurrentTurnIndex,
    advanceTurn,
    broadcastPlayersUpdate,
    refs,
    messageOverrides,
  ]);
}
