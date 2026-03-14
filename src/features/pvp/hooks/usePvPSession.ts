/**
 * PvP Session Hook - Player vs Player game logic
 * DOMAIN LAYER - Host chooses word, up to 5 guests guess in turns
 *
 * ISO/IEC 25010 - Reliability: Fixed race condition in message handling
 * Supports up to 6 players (1 word chooser + 5 guessers)
 */

import { useState, useRef } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { MAX_PLAYERS } from '@/types/room';
import { usePvPRoom } from './usePvPRoom';
import { usePvPEffects } from './usePvPEffects';
import { usePvPCallbacks } from './usePvPCallbacks';
import { usePvPState } from './usePvPState';

export type PvPPhase = 'lobby' | 'waiting' | 'word-input' | 'playing';

interface UsePvPSessionOptions {
  playerName: string;
  initialJoinId?: string;
}

export function usePvPSession({ playerName, initialJoinId = '' }: UsePvPSessionOptions) {
  const [phase, setPhase] = useState<PvPPhase>('lobby');
  const [joinId, setJoinId] = useState(initialJoinId);
  const [customWord, setCustomWord] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const peer = usePeerConnection();
  const game = useGameLogic();
  const { addEntry } = useLeaderboardStore();
  const room = usePvPRoom(peer);
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

  const { refs, guessers, currentGuesser, isMyTurn, wordScore } = usePvPState({
    game,
    phase,
    players,
    currentTurnIndex,
    peer,
    startBroadcastSentRef,
  });

  usePvPEffects({
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

  const callbacks = usePvPCallbacks({
    playerName,
    joinId,
    customWord,
    customCategory,
    peer,
    game,
    isMyTurn,
    phase,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    setCustomWord,
    setCustomCategory,
    startBroadcastSentRef,
    hasRecordedRef,
  });

  return {
    phase,
    joinId,
    setJoinId,
    customWord,
    setCustomWord,
    customCategory,
    setCustomCategory,
    peerId: peer.peerId,
    status: peer.status,
    error: peer.error,
    isHost: peer.isHost,
    connectedPeers: peer.connectedPeers,
    players,
    guessers,
    currentTurnIndex,
    currentGuesser,
    isMyTurn,
    canPlay: phase === 'playing' && isMyTurn,
    maxPlayers: MAX_PLAYERS,
    gameState: game.gameState,
    displayWord: game.displayWord,
    sessionScore,
    wordsWon,
    wordScore,
    ...callbacks,
  };
}
