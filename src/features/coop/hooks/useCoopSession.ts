/**
 * Coop Session Hook - Multiplayer cooperative game logic
 * DOMAIN LAYER - Pure business logic
 *
 * ISO/IEC 25010 - Reliability: Fixed race condition in message handling
 * Supports up to 6 players with turn-based guessing
 */

import { useState, useEffect, useRef } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { useDifficultyStore } from '@/stores/difficulty';
import { calculateScore } from '@/lib/game-engine';
import { calculateDifficultyScore } from '@/lib/difficulty-config';
import { MAX_PLAYERS } from '@/types/room';
import type { WordCategory } from '@/lib/categories';
import { useCoopRoom } from './useCoopRoom';
import { useCoopEffects } from './useCoopEffects';
import { useCoopCallbacks } from './useCoopCallbacks';
import type { CoopRefs } from './useCoopMessageHandler';

export type CoopPhase = 'lobby' | 'waiting' | 'playing';

interface UseCoopSessionOptions {
  playerName: string;
  initialJoinId?: string;
}

export function useCoopSession({ playerName, initialJoinId = '' }: UseCoopSessionOptions) {
  const [phase, setPhase] = useState<CoopPhase>('lobby');
  const [joinId, setJoinId] = useState(initialJoinId);
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
  const peer = usePeerConnection();
  const game = useGameLogic();
  const { addEntry } = useLeaderboardStore();
  const { level: storeDifficulty } = useDifficultyStore();
  const room = useCoopRoom(peer);
  const {
    players,
    currentTurnIndex,
    broadcastPlayersUpdate,
    advanceTurn,
    setPlayers,
    setCurrentTurnIndex,
  } = room;

  const [sessionScore, setSessionScore] = useState(0);
  const [wordsWon, setWordsWon] = useState(0);
  const hasRecordedRef = useRef(false);
  const startBroadcastSentRef = useRef(false);

  const gameRef = useRef(game);
  const phaseRef = useRef(phase);
  const playersRef = useRef(players);
  const currentTurnIndexRef = useRef(currentTurnIndex);
  useEffect(() => {
    gameRef.current = game;
    phaseRef.current = phase;
  }, [game, phase]);
  useEffect(() => {
    playersRef.current = players;
    currentTurnIndexRef.current = currentTurnIndex;
  }, [players, currentTurnIndex]);

  const refs: CoopRefs = {
    gameRef,
    phaseRef,
    playersRef,
    currentTurnIndexRef,
    startBroadcastSentRef,
  };
  const difficulty = game.gameState?.difficulty ?? 'normal';
  const wordScore = game.gameState
    ? calculateDifficultyScore(calculateScore(game.gameState.word), difficulty)
    : 0;
  const currentPlayer = players[currentTurnIndex] ?? null;
  const isMyTurn = currentPlayer?.id === peer.peerId;

  useCoopEffects({
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
  });

  const callbacks = useCoopCallbacks({
    playerName,
    joinId,
    peer,
    game,
    isMyTurn,
    phase,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    startBroadcastSentRef,
    hasRecordedRef,
    advanceTurn,
    selectedCategory,
    difficulty: storeDifficulty,
  });

  return {
    phase,
    joinId,
    setJoinId,
    peerId: peer.peerId,
    status: peer.status,
    error: peer.error,
    isHost: peer.isHost,
    connectedPeers: peer.connectedPeers,
    players,
    currentTurnIndex,
    currentPlayer,
    isMyTurn,
    canPlay: phase === 'playing' && isMyTurn,
    maxPlayers: MAX_PLAYERS,
    gameState: game.gameState,
    displayWord: game.displayWord,
    sessionScore,
    wordsWon,
    wordScore,
    selectedCategory,
    setSelectedCategory,
    ...callbacks,
  };
}
