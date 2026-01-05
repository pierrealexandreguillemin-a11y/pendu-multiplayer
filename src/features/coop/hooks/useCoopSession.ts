/**
 * Coop Session Hook - Multiplayer cooperative game logic
 * DOMAIN LAYER - Pure business logic
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { calculateScore } from '@/lib/game-engine';
import type { Letter } from '@/types/game';

export type CoopPhase = 'lobby' | 'waiting' | 'playing';

interface UseCoopSessionOptions {
  playerName: string;
  initialJoinId?: string;
}

export function useCoopSession({ playerName, initialJoinId = '' }: UseCoopSessionOptions) {
  const [phase, setPhase] = useState<CoopPhase>('lobby');
  const [joinId, setJoinId] = useState(initialJoinId);

  const peer = usePeerConnection();
  const game = useGameLogic();
  const { addEntry } = useLeaderboardStore();

  // Session state - arcade cumulative
  const [sessionScore, setSessionScore] = useState(0);
  const [wordsWon, setWordsWon] = useState(0);
  const hasRecordedRef = useRef(false);

  const wordScore = game.gameState ? calculateScore(game.gameState.word) : 0;

  // Record on DEFEAT
  useEffect(() => {
    if (game.gameState?.status === 'lost' && playerName && !hasRecordedRef.current) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: 'coop',
        score: sessionScore,
        word: `${wordsWon} mots`,
        errors: game.gameState.errors,
        won: false,
      });
    }
  }, [
    game.gameState?.status,
    game.gameState?.errors,
    playerName,
    sessionScore,
    wordsWon,
    addEntry,
  ]);

  // Handle incoming messages
  useEffect(() => {
    peer.onMessage((message) => {
      switch (message.type) {
        case 'start':
          if (!peer.isHost) {
            game.startGame(message.payload.word, message.payload.category);
            setPhase('playing');
          }
          break;
        case 'guess':
          game.guess(message.payload.letter);
          break;
        case 'restart':
          game.startGame();
          setPhase('playing');
          break;
      }
    });
  }, [peer, game]);

  // Send start when host starts
  useEffect(() => {
    if (peer.isHost && phase === 'playing' && game.gameState) {
      peer.sendMessage({
        type: 'start',
        payload: { word: game.gameState.word, category: game.gameState.category ?? '' },
      });
    }
  }, [peer, phase, game.gameState]);

  const createRoom = useCallback(async () => {
    if (!playerName.trim()) return;
    await peer.createRoom();
    setPhase('waiting');
  }, [playerName, peer]);

  const joinRoom = useCallback(async () => {
    if (!playerName.trim() || !joinId.trim()) return;
    await peer.joinRoom(joinId.trim());
    setPhase('waiting');
  }, [playerName, joinId, peer]);

  const startGame = useCallback(() => {
    hasRecordedRef.current = false;
    game.startGame();
    setPhase('playing');
  }, [game]);

  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    if (currentWord) {
      setSessionScore((prev) => prev + calculateScore(currentWord));
      setWordsWon((prev) => prev + 1);
    }
    hasRecordedRef.current = false;
    game.startGame();
    peer.sendMessage({ type: 'restart', payload: {} });
  }, [game, peer]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      game.guess(letter);
      peer.sendMessage({ type: 'guess', payload: { letter } });
    },
    [game, peer]
  );

  const endSession = useCallback(() => {
    peer.disconnect();
    setPhase('lobby');
    setSessionScore(0);
    setWordsWon(0);
  }, [peer]);

  return {
    // Phase
    phase,
    joinId,
    setJoinId,

    // Peer state
    peerId: peer.peerId,
    status: peer.status,
    isHost: peer.isHost,
    connectedPeers: peer.connectedPeers,

    // Game state
    gameState: game.gameState,
    displayWord: game.displayWord,

    // Session
    sessionScore,
    wordsWon,
    wordScore,

    // Actions
    createRoom,
    joinRoom,
    startGame,
    continueSession,
    handleGuess,
    endSession,
  };
}
