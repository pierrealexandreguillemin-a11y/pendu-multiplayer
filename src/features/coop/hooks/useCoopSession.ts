/**
 * Coop Session Hook - Multiplayer cooperative game logic
 * DOMAIN LAYER - Pure business logic
 *
 * ISO/IEC 25010 - Reliability: Fixed race condition in message handling
 * Supports up to 6 players with turn-based guessing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { calculateScore } from '@/lib/game-engine';
import type { Letter, GameMessage } from '@/types/game';
import { MAX_PLAYERS } from '@/types/room';

export type CoopPhase = 'lobby' | 'waiting' | 'playing';

/** Simple player info for room management */
interface CoopPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

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

  // Room state for 6-player support
  const [players, setPlayers] = useState<CoopPlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Session state - arcade cumulative
  const [sessionScore, setSessionScore] = useState(0);
  const [wordsWon, setWordsWon] = useState(0);
  const hasRecordedRef = useRef(false);

  // Refs for stable message handler (avoids race condition)
  const gameRef = useRef(game);
  const phaseRef = useRef(phase);
  const playersRef = useRef(players);
  const currentTurnIndexRef = useRef(currentTurnIndex);

  // Keep refs in sync with current values
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    currentTurnIndexRef.current = currentTurnIndex;
  }, [currentTurnIndex]);

  const wordScore = game.gameState ? calculateScore(game.gameState.word) : 0;

  // Get current player whose turn it is
  const currentPlayer = players[currentTurnIndex] ?? null;
  const isMyTurn = currentPlayer?.id === peer.peerId;
  const canPlay = phase === 'playing' && isMyTurn;

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

  // Broadcast players update (host only)
  const broadcastPlayersUpdate = useCallback(() => {
    if (!peer.isHost) return;

    peer.sendMessage({
      type: 'players_update',
      payload: {
        players: playersRef.current.map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isReady: p.isReady,
          score: p.score,
        })),
        currentTurnIndex: currentTurnIndexRef.current,
      },
    });
  }, [peer]);

  // Advance to next player's turn
  const advanceTurn = useCallback(() => {
    if (playersRef.current.length === 0) return;

    const nextIndex = (currentTurnIndexRef.current + 1) % playersRef.current.length;
    setCurrentTurnIndex(nextIndex);

    // Broadcast turn change
    const nextPlayer = playersRef.current[nextIndex];
    if (nextPlayer && peer.isHost) {
      peer.sendMessage({
        type: 'turn_change',
        payload: {
          currentTurnIndex: nextIndex,
          currentPlayerId: nextPlayer.id,
        },
      });
    }
  }, [peer]);

  // Handle incoming messages - uses refs to avoid stale closures
  // ISO/IEC 25010 - Reliability: Single handler registration with cleanup
  useEffect(() => {
    const handleMessage = (message: GameMessage) => {
      switch (message.type) {
        case 'start':
          if (!peer.isHost) {
            gameRef.current.startGame(message.payload.word, message.payload.category);
            setPhase('playing');
          }
          break;

        case 'guess':
          gameRef.current.guess(message.payload.letter);
          // Host advances turn after each guess
          if (peer.isHost) {
            advanceTurn();
          }
          break;

        case 'restart':
          gameRef.current.startGame();
          setPhase('playing');
          break;

        case 'state':
          // Resync state if needed
          break;

        case 'player_join':
          // Host receives player join request
          if (peer.isHost) {
            const { playerId, playerName: newPlayerName } = message.payload;

            // Check room capacity
            if (playersRef.current.length >= MAX_PLAYERS) {
              console.warn('[Coop] Room is full, rejecting player:', playerId);
              return;
            }

            // Add player to list
            const newPlayer: CoopPlayer = {
              id: playerId,
              name: newPlayerName,
              isHost: false,
              isReady: true,
              score: 0,
            };

            setPlayers((prev) => {
              // Avoid duplicates
              if (prev.some((p) => p.id === playerId)) return prev;
              return [...prev, newPlayer];
            });

            // Broadcast updated player list
            setTimeout(() => broadcastPlayersUpdate(), 100);
          }
          break;

        case 'players_update':
          // Guests receive player list updates from host
          if (!peer.isHost) {
            setPlayers(message.payload.players);
            setCurrentTurnIndex(message.payload.currentTurnIndex);
          }
          break;

        case 'turn_change':
          // All players receive turn changes
          setCurrentTurnIndex(message.payload.currentTurnIndex);
          break;
      }
    };

    peer.onMessage(handleMessage);

    // Cleanup: remove handler when effect re-runs or unmounts
    return () => {
      peer.offMessage();
    };
  }, [peer, advanceTurn, broadcastPlayersUpdate]); // Only peer as dependency - stable reference

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
    const peerId = await peer.createRoom();

    // Initialize host as first player
    const hostPlayer: CoopPlayer = {
      id: peerId,
      name: playerName.trim(),
      isHost: true,
      isReady: true,
      score: 0,
    };
    setPlayers([hostPlayer]);
    setCurrentTurnIndex(0);
    setPhase('waiting');
  }, [playerName, peer]);

  const joinRoom = useCallback(async () => {
    if (!playerName.trim() || !joinId.trim()) return;
    await peer.joinRoom(joinId.trim());

    // Send join request to host
    setTimeout(() => {
      peer.sendMessage({
        type: 'player_join',
        payload: {
          playerId: peer.peerId ?? '',
          playerName: playerName.trim(),
        },
      });
    }, 500);

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
      // Check if it's this player's turn (turn-based logic)
      if (!isMyTurn && phase === 'playing') {
        console.warn('[Coop] Not your turn!');
        return;
      }

      game.guess(letter);
      peer.sendMessage({ type: 'guess', payload: { letter } });

      // Host advances turn locally (will broadcast to others)
      if (peer.isHost) {
        advanceTurn();
      }
    },
    [game, peer, isMyTurn, phase, advanceTurn]
  );

  const endSession = useCallback(() => {
    peer.disconnect();
    setPhase('lobby');
    setPlayers([]);
    setCurrentTurnIndex(0);
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

    // Room state (6-player support)
    players,
    currentTurnIndex,
    currentPlayer,
    isMyTurn,
    canPlay,
    maxPlayers: MAX_PLAYERS,

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
