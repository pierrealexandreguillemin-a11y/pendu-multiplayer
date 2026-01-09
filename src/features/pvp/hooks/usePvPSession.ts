/**
 * PvP Session Hook - Player vs Player game logic
 * DOMAIN LAYER - Host chooses word, up to 5 guests guess in turns
 *
 * ISO/IEC 25010 - Reliability: Fixed race condition in message handling
 * Supports up to 6 players (1 word chooser + 5 guessers)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboardStore } from '@/stores/leaderboard';
import { calculateScore } from '@/lib/game-engine';
import { calculateDifficultyScore } from '@/lib/difficulty-config';
import type { Letter, GameMessage } from '@/types/game';
import { MAX_PLAYERS } from '@/types/room';

export type PvPPhase = 'lobby' | 'waiting' | 'word-input' | 'playing';

/** Simple player info for room management */
interface PvPPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

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

  // Room state for 6-player support (1 host + 5 guessers)
  const [players, setPlayers] = useState<PvPPlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Session state - arcade cumulative (guessers only)
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

  // Get guessers (everyone except host)
  const guessers = players.filter((p) => !p.isHost);

  // Get current guesser whose turn it is
  const currentGuesser = guessers[currentTurnIndex] ?? null;
  const isMyTurn = !peer.isHost && currentGuesser?.id === peer.peerId;
  const canPlay = phase === 'playing' && isMyTurn;

  // ISO/IEC 25010 - Reliability: Send start message when gameState is ready
  // This replaces the fragile setTimeout approach with a reactive pattern
  useEffect(() => {
    if (!startBroadcastSentRef.current && peer.isHost && game.gameState && phase === 'playing') {
      peer.sendMessage({
        type: 'start',
        payload: {
          word: game.gameState.word,
          category: game.gameState.category ?? 'PvP',
        },
      });
      startBroadcastSentRef.current = true;
    }
  }, [peer, game.gameState, phase]);

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

  // Broadcast players update (host only)
  // ISO/IEC 25010 - Reliability: Accept explicit player list to avoid stale ref issues
  const broadcastPlayersUpdate = useCallback(
    (playerList?: PvPPlayer[], turnIndex?: number) => {
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

  // Advance to next guesser's turn
  const advanceTurn = useCallback(() => {
    const guessersList = playersRef.current.filter((p) => !p.isHost);
    if (guessersList.length === 0) return;

    const nextIndex = (currentTurnIndexRef.current + 1) % guessersList.length;
    setCurrentTurnIndex(nextIndex);

    // Broadcast turn change
    const nextGuesser = guessersList[nextIndex];
    if (nextGuesser && peer.isHost) {
      peer.sendMessage({
        type: 'turn_change',
        payload: {
          currentTurnIndex: nextIndex,
          currentPlayerId: nextGuesser.id,
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

      // Adjust turn index for guessers (excluding host)
      const updatedGuessers = updatedPlayers.filter((p) => !p.isHost);
      let newTurnIndex = currentTurnIndexRef.current;
      if (updatedGuessers.length > 0) {
        // Find position of disconnected player among guessers
        const guesserIndex = playersRef.current
          .filter((p) => !p.isHost)
          .findIndex((p) => p.id === disconnectedPeerId);

        if (guesserIndex !== -1) {
          if (guesserIndex < currentTurnIndexRef.current) {
            newTurnIndex = currentTurnIndexRef.current - 1;
          } else if (guesserIndex === currentTurnIndexRef.current) {
            newTurnIndex = currentTurnIndexRef.current % updatedGuessers.length;
          }
        }
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
            // Host (word chooser) applies guess locally
            gameRef.current.guess(message.payload.letter);
            // Host relays to ALL guessers (including sender, who will ignore duplicate)
            peer.sendMessage({ type: 'guess', payload: { letter: message.payload.letter } });
            advanceTurn();
          } else {
            // Guesser receives relayed guess from host - apply locally
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
          if (!peer.isHost) {
            setPhase('waiting');
          }
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
              console.warn('[PvP] Room is full, rejecting player:', playerId);
              return;
            }

            // Avoid duplicates
            if (playersRef.current.some((p) => p.id === playerId)) {
              console.warn('[PvP] Player already in room:', playerId);
              return;
            }

            // Add player to list
            const newPlayer: PvPPlayer = {
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
          // Guessers receive turn changes
          if (!peer.isHost) {
            setCurrentTurnIndex(message.payload.currentTurnIndex);
          }
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

    // Initialize host as word chooser (not a guesser)
    const hostPlayer: PvPPlayer = {
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
      console.error('[PvP] Failed to get peerId after joining');
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

  const goToWordInput = useCallback(() => {
    setPhase('word-input');
  }, []);

  const startGameWithWord = useCallback(() => {
    if (!customWord.trim()) return;
    // ISO/IEC 25010 - Reliability: Reset broadcast flag for new game
    startBroadcastSentRef.current = false;
    game.startGame(customWord.trim(), customCategory.trim() || 'PvP');
    setPhase('playing');
  }, [customWord, customCategory, game]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      // Host (word chooser) cannot guess
      if (peer.isHost) {
        console.warn('[PvP] Host cannot guess!');
        return;
      }

      // Check if it's this player's turn (turn-based logic)
      if (!isMyTurn && phase === 'playing') {
        console.warn('[PvP] Not your turn!');
        return;
      }

      game.guess(letter);
      peer.sendMessage({ type: 'guess', payload: { letter } });
    },
    [game, peer, isMyTurn, phase]
  );

  // ISO/IEC 25010 - Apply difficulty multiplier to score
  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    const currentDifficulty = game.gameState?.difficulty ?? 'normal';
    if (currentWord && !peer.isHost) {
      const baseScore = calculateScore(currentWord);
      const finalScore = calculateDifficultyScore(baseScore, currentDifficulty);
      setSessionScore((prev) => prev + finalScore);
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
    setPlayers([]);
    setCurrentTurnIndex(0);
    setSessionScore(0);
    setWordsWon(0);
    startBroadcastSentRef.current = false;
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
    error: peer.error,
    isHost: peer.isHost,
    connectedPeers: peer.connectedPeers,

    // Room state (6-player support: 1 host + 5 guessers)
    players,
    guessers,
    currentTurnIndex,
    currentGuesser,
    isMyTurn,
    canPlay,
    maxPlayers: MAX_PLAYERS,

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
