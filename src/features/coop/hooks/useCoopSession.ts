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
import { calculateDifficultyScore } from '@/lib/difficulty-config';
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

  // ISO/IEC 25010 - Reliability: Track if start message has been sent for current game
  const startBroadcastSentRef = useRef(false);

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

  // ISO/IEC 25010 - Apply difficulty multiplier to displayed word score
  const difficulty = game.gameState?.difficulty ?? 'normal';
  const wordScore = game.gameState
    ? calculateDifficultyScore(calculateScore(game.gameState.word), difficulty)
    : 0;

  // Get current player whose turn it is
  const currentPlayer = players[currentTurnIndex] ?? null;
  const isMyTurn = currentPlayer?.id === peer.peerId;
  const canPlay = phase === 'playing' && isMyTurn;

  // ISO/IEC 25010 - Reliability: Send start message when gameState is ready
  // This replaces the fragile setTimeout approach with a reactive pattern
  useEffect(() => {
    if (!startBroadcastSentRef.current && peer.isHost && game.gameState && phase === 'playing') {
      peer.sendMessage({
        type: 'start',
        payload: {
          word: game.gameState.word,
          category: game.gameState.category ?? '',
        },
      });
      startBroadcastSentRef.current = true;
    }
  }, [peer, game.gameState, phase]);

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
  // ISO/IEC 25010 - Reliability: Accept explicit player list to avoid stale ref issues
  const broadcastPlayersUpdate = useCallback(
    (playerList?: CoopPlayer[], turnIndex?: number) => {
      if (!peer.isHost) return;

      const playersToSend = playerList ?? playersRef.current;
      const indexToSend = turnIndex ?? currentTurnIndexRef.current;

      peer.sendMessage({
        type: 'players_update',
        payload: {
          players: playersToSend.map((p) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isReady: p.isReady,
            score: p.score,
          })),
          currentTurnIndex: indexToSend,
        },
      });
    },
    [peer]
  );

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

  // ISO/IEC 25010 - Reliability: Handle player disconnection
  useEffect(() => {
    const handleDisconnect = (disconnectedPeerId: string) => {
      if (!peer.isHost) return; // Only host manages player list

      const playerIndex = playersRef.current.findIndex((p) => p.id === disconnectedPeerId);
      if (playerIndex === -1) return;

      // Remove player from list
      const updatedPlayers = playersRef.current.filter((p) => p.id !== disconnectedPeerId);
      setPlayers(updatedPlayers);

      // Adjust turn index if needed
      let newTurnIndex = currentTurnIndexRef.current;
      if (updatedPlayers.length > 0) {
        if (playerIndex < currentTurnIndexRef.current) {
          // Disconnected player was before current turn - shift index back
          newTurnIndex = currentTurnIndexRef.current - 1;
        } else if (playerIndex === currentTurnIndexRef.current) {
          // Disconnected player had current turn - keep index but wrap if needed
          newTurnIndex = currentTurnIndexRef.current % updatedPlayers.length;
        }
        // If disconnected player was after current turn, no change needed
      }
      setCurrentTurnIndex(newTurnIndex);

      // Broadcast updated player list
      broadcastPlayersUpdate(updatedPlayers, newTurnIndex);
    };

    peer.onPeerDisconnect(handleDisconnect);
    return () => {
      peer.offPeerDisconnect();
    };
  }, [peer, broadcastPlayersUpdate]);

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
          // ISO/IEC 25010 - Reliability: Host must relay guess to all other guests
          // In star topology, only host receives from guests, so host must broadcast
          if (peer.isHost) {
            // Host applies guess locally
            gameRef.current.guess(message.payload.letter);
            // Host relays to ALL guests (including sender, who will ignore duplicate)
            peer.sendMessage({ type: 'guess', payload: { letter: message.payload.letter } });
            advanceTurn();
          } else {
            // Guest receives relayed guess from host - apply locally
            // Skip if already guessed (sender's own message relayed back)
            const letter = message.payload.letter;
            const alreadyGuessed =
              gameRef.current.gameState?.correctLetters.has(letter) ||
              gameRef.current.gameState?.wrongLetters.has(letter);
            if (!alreadyGuessed) {
              gameRef.current.guess(letter);
            }
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

            // Avoid duplicates
            if (playersRef.current.some((p) => p.id === playerId)) {
              console.warn('[Coop] Player already in room:', playerId);
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

            // ISO/IEC 25010 - Reliability: Build new list and broadcast immediately
            const updatedPlayers = [...playersRef.current, newPlayer];
            setPlayers(updatedPlayers);

            // Broadcast with explicit data to avoid stale ref
            broadcastPlayersUpdate(updatedPlayers, currentTurnIndexRef.current);
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

    // ISO/IEC 25010 - Reliability: Wait for stable connection before sending join
    // The peerId is guaranteed to be set after joinRoom resolves
    const currentPeerId = peer.peerId;
    if (!currentPeerId) {
      console.error('[Coop] Failed to get peerId after joining');
      return;
    }

    // Small delay to ensure connection is fully established
    await new Promise((resolve) => setTimeout(resolve, 300));

    peer.sendMessage({
      type: 'player_join',
      payload: {
        playerId: currentPeerId,
        playerName: playerName.trim(),
      },
    });

    setPhase('waiting');
  }, [playerName, joinId, peer]);

  const startGame = useCallback(() => {
    hasRecordedRef.current = false;
    // ISO/IEC 25010 - Reliability: Reset broadcast flag for new game
    startBroadcastSentRef.current = false;
    game.startGame();
    setPhase('playing');
  }, [game]);

  // ISO/IEC 25010 - Apply difficulty multiplier to score
  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    const currentDifficulty = game.gameState?.difficulty ?? 'normal';
    if (currentWord) {
      const baseScore = calculateScore(currentWord);
      const finalScore = calculateDifficultyScore(baseScore, currentDifficulty);
      setSessionScore((prev) => prev + finalScore);
      setWordsWon((prev) => prev + 1);
    }
    hasRecordedRef.current = false;
    // ISO/IEC 25010 - Reliability: Reset broadcast flag for new game
    startBroadcastSentRef.current = false;
    game.startGame();
  }, [game]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      // Check if it's this player's turn (turn-based logic)
      if (!isMyTurn && phase === 'playing') {
        console.warn('[Coop] Not your turn!');
        return;
      }

      // ISO/IEC 25010 - Reliability: Different handling for host vs guest
      if (peer.isHost) {
        // Host applies locally AND broadcasts to all guests
        game.guess(letter);
        peer.sendMessage({ type: 'guess', payload: { letter } });
        advanceTurn();
      } else {
        // Guest applies locally first (optimistic) then sends to host
        // Host will relay to all guests, but we already applied it
        game.guess(letter);
        peer.sendMessage({ type: 'guess', payload: { letter } });
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
    startBroadcastSentRef.current = false;
  }, [peer]);

  return {
    // Phase
    phase,
    joinId,
    setJoinId,

    // Peer state
    peerId: peer.peerId,
    status: peer.status,
    error: peer.error,
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
