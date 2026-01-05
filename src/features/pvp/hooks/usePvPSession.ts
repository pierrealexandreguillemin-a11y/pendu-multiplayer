/**
 * PvP Session Hook - Player vs Player game logic
 * DOMAIN LAYER - Host chooses word, guests guess
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { calculateScore } from '@/lib/game-engine';
import type { Letter } from '@/types/game';

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

  // Session state - arcade cumulative (guessers only)
  const [sessionScore, setSessionScore] = useState(0);
  const [wordsWon, setWordsWon] = useState(0);
  const hasRecordedRef = useRef(false);

  const wordScore = game.gameState ? calculateScore(game.gameState.word) : 0;

  // Record on DEFEAT (guessers only)
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
        won: false,
      });
    }
  }, [
    game.gameState?.status,
    game.gameState?.errors,
    peer.isHost,
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
          if (!peer.isHost) {
            setPhase('waiting');
          }
          break;
      }
    });
  }, [peer, game]);

  // Send start when host starts
  useEffect(() => {
    if (peer.isHost && phase === 'playing' && game.gameState) {
      peer.sendMessage({
        type: 'start',
        payload: { word: game.gameState.word, category: game.gameState.category ?? 'PvP' },
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

  const goToWordInput = useCallback(() => {
    setPhase('word-input');
  }, []);

  const startGameWithWord = useCallback(() => {
    if (!customWord.trim()) return;
    game.startGame(customWord.trim(), customCategory.trim() || 'PvP');
    setPhase('playing');
  }, [customWord, customCategory, game]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      game.guess(letter);
      peer.sendMessage({ type: 'guess', payload: { letter } });
    },
    [game, peer]
  );

  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    if (currentWord && !peer.isHost) {
      setSessionScore((prev) => prev + calculateScore(currentWord));
      setWordsWon((prev) => prev + 1);
    }
    hasRecordedRef.current = false;
    setCustomWord('');
    setCustomCategory('');
    setPhase('word-input');
    peer.sendMessage({ type: 'restart', payload: {} });
  }, [game, peer]);

  const endSession = useCallback(() => {
    peer.disconnect();
    setPhase('lobby');
    setSessionScore(0);
    setWordsWon(0);
  }, [peer]);

  const goBackToWaiting = useCallback(() => {
    setPhase('waiting');
  }, []);

  return {
    // Phase
    phase,
    joinId,
    setJoinId,
    customWord,
    setCustomWord,
    customCategory,
    setCustomCategory,

    // Peer state
    peerId: peer.peerId,
    status: peer.status,
    isHost: peer.isHost,
    connectedPeers: peer.connectedPeers,

    // Game state
    gameState: game.gameState,
    displayWord: game.displayWord,

    // Session (guessers)
    sessionScore,
    wordsWon,
    wordScore,

    // Actions
    createRoom,
    joinRoom,
    goToWordInput,
    goBackToWaiting,
    startGameWithWord,
    handleGuess,
    continueSession,
    endSession,
  };
}
