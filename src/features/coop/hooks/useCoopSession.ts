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

// Refs bundle passed to message handlers to avoid stale closures
interface CoopRefs {
  gameRef: React.MutableRefObject<ReturnType<typeof useGameLogic>>;
  phaseRef: React.MutableRefObject<CoopPhase>;
  playersRef: React.MutableRefObject<CoopPlayer[]>;
  currentTurnIndexRef: React.MutableRefObject<number>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

interface CoopActions {
  isHost: boolean;
  sendMessage: ReturnType<typeof usePeerConnection>['sendMessage'];
  setPhase: (phase: CoopPhase) => void;
  setPlayers: (players: CoopPlayer[]) => void;
  setCurrentTurnIndex: (index: number) => void;
  advanceTurn: () => void;
  broadcastPlayersUpdate: (playerList?: CoopPlayer[], turnIndex?: number) => void;
}

function handleStartMessage(
  payload: Extract<GameMessage, { type: 'start' }>['payload'],
  refs: CoopRefs,
  actions: CoopActions
) {
  if (!actions.isHost && refs.phaseRef.current !== 'playing') {
    refs.gameRef.current.startGame(payload.word, payload.category);
    actions.setPhase('playing');
  }
}

function handleGuessMessage(
  payload: Extract<GameMessage, { type: 'guess' }>['payload'],
  refs: CoopRefs,
  actions: CoopActions
) {
  if (actions.isHost) {
    refs.gameRef.current.guess(payload.letter);
    actions.sendMessage({ type: 'guess', payload: { letter: payload.letter } });
    actions.advanceTurn();
  } else {
    const letter = payload.letter;
    const alreadyGuessed =
      refs.gameRef.current.gameState?.correctLetters.has(letter) ||
      refs.gameRef.current.gameState?.wrongLetters.has(letter);
    if (!alreadyGuessed) refs.gameRef.current.guess(letter);
  }
}

function handlePlayerJoinMessage(
  payload: Extract<GameMessage, { type: 'player_join' }>['payload'],
  refs: CoopRefs,
  actions: CoopActions
) {
  if (!actions.isHost) return;
  const { playerId, playerName: newPlayerName } = payload;
  if (refs.playersRef.current.length >= MAX_PLAYERS) {
    console.warn('[Coop] Room is full, rejecting player:', playerId);
    return;
  }
  if (refs.playersRef.current.some((p) => p.id === playerId)) {
    console.warn('[Coop] Player already in room:', playerId);
    return;
  }
  const newPlayer: CoopPlayer = {
    id: playerId,
    name: newPlayerName,
    isHost: false,
    isReady: true,
    score: 0,
  };
  const updatedPlayers = [...refs.playersRef.current, newPlayer];
  actions.setPlayers(updatedPlayers);
  actions.broadcastPlayersUpdate(updatedPlayers, refs.currentTurnIndexRef.current);
  if (refs.phaseRef.current === 'playing' && refs.gameRef.current.gameState) {
    refs.startBroadcastSentRef.current = false;
  }
}

function buildCoopMessageHandler(refs: CoopRefs, actions: CoopActions) {
  return function handleMessage(message: GameMessage) {
    switch (message.type) {
      case 'start':
        handleStartMessage(message.payload, refs, actions);
        break;
      case 'guess':
        handleGuessMessage(message.payload, refs, actions);
        break;
      case 'restart':
        refs.gameRef.current.startGame();
        actions.setPhase('playing');
        break;
      case 'state':
        break;
      case 'player_join':
        handlePlayerJoinMessage(message.payload, refs, actions);
        break;
      case 'players_update':
        if (!actions.isHost) {
          actions.setPlayers(message.payload.players);
          actions.setCurrentTurnIndex(message.payload.currentTurnIndex);
        }
        break;
      case 'turn_change':
        actions.setCurrentTurnIndex(message.payload.currentTurnIndex);
        break;
    }
  };
}

interface CoopRoomState {
  players: CoopPlayer[];
  currentTurnIndex: number;
  broadcastPlayersUpdate: (playerList?: CoopPlayer[], turnIndex?: number) => void;
  advanceTurn: () => void;
  setPlayers: React.Dispatch<React.SetStateAction<CoopPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
}

function useCoopRoom(peer: ReturnType<typeof usePeerConnection>): CoopRoomState {
  const [players, setPlayers] = useState<CoopPlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const playersRef = useRef(players);
  const currentTurnIndexRef = useRef(currentTurnIndex);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    currentTurnIndexRef.current = currentTurnIndex;
  }, [currentTurnIndex]);

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

  const advanceTurn = useCallback(() => {
    if (playersRef.current.length === 0) return;
    const nextIndex = (currentTurnIndexRef.current + 1) % playersRef.current.length;
    setCurrentTurnIndex(nextIndex);
    const nextPlayer = playersRef.current[nextIndex];
    if (nextPlayer && peer.isHost) {
      peer.sendMessage({
        type: 'turn_change',
        payload: { currentTurnIndex: nextIndex, currentPlayerId: nextPlayer.id },
      });
    }
  }, [peer]);

  useEffect(() => {
    const handleDisconnect = (disconnectedPeerId: string) => {
      if (!peer.isHost) return;
      const playerIndex = playersRef.current.findIndex((p) => p.id === disconnectedPeerId);
      if (playerIndex === -1) return;
      const updatedPlayers = playersRef.current.filter((p) => p.id !== disconnectedPeerId);
      setPlayers(updatedPlayers);
      let newTurnIndex = currentTurnIndexRef.current;
      if (updatedPlayers.length === 0) newTurnIndex = 0;
      else if (playerIndex < currentTurnIndexRef.current)
        newTurnIndex = currentTurnIndexRef.current - 1;
      else if (playerIndex === currentTurnIndexRef.current)
        newTurnIndex = currentTurnIndexRef.current % updatedPlayers.length;
      setCurrentTurnIndex(newTurnIndex);
      broadcastPlayersUpdate(updatedPlayers, newTurnIndex);
    };
    peer.onPeerDisconnect(handleDisconnect);
    return () => {
      peer.offPeerDisconnect();
    };
  }, [peer, broadcastPlayersUpdate]);

  return {
    players,
    currentTurnIndex,
    broadcastPlayersUpdate,
    advanceTurn,
    setPlayers,
    setCurrentTurnIndex,
  };
}

export function useCoopSession({ playerName, initialJoinId = '' }: UseCoopSessionOptions) {
  const [phase, setPhase] = useState<CoopPhase>('lobby');
  const [joinId, setJoinId] = useState(initialJoinId);

  const peer = usePeerConnection();
  const game = useGameLogic();
  const { addEntry } = useLeaderboardStore();

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

  const difficulty = game.gameState?.difficulty ?? 'normal';
  const wordScore = game.gameState
    ? calculateDifficultyScore(calculateScore(game.gameState.word), difficulty)
    : 0;
  const currentPlayer = players[currentTurnIndex] ?? null;
  const isMyTurn = currentPlayer?.id === peer.peerId;
  const canPlay = phase === 'playing' && isMyTurn;

  useEffect(() => {
    if (!startBroadcastSentRef.current && peer.isHost && game.gameState && phase === 'playing') {
      peer.sendMessage({
        type: 'start',
        payload: { word: game.gameState.word, category: game.gameState.category ?? '' },
      });
      startBroadcastSentRef.current = true;
    }
  }, [peer, game.gameState, phase]);

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
  ]);

  useEffect(() => {
    const refs: CoopRefs = {
      gameRef,
      phaseRef,
      playersRef,
      currentTurnIndexRef,
      startBroadcastSentRef,
    };
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
  }, [peer, advanceTurn, broadcastPlayersUpdate, setPlayers, setCurrentTurnIndex]);

  const createRoom = useCallback(async () => {
    if (!playerName.trim()) return;
    const peerId = await peer.createRoom();
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
  }, [playerName, peer, setPlayers, setCurrentTurnIndex]);

  const joinRoom = useCallback(async () => {
    if (!playerName.trim() || !joinId.trim()) return;
    const myPeerId = await peer.joinRoom(joinId.trim());
    peer.sendMessage({
      type: 'player_join',
      payload: { playerId: myPeerId, playerName: playerName.trim() },
    });
    setPhase('waiting');
  }, [playerName, joinId, peer]);

  const startGame = useCallback(() => {
    hasRecordedRef.current = false;
    startBroadcastSentRef.current = false;
    game.startGame();
    setPhase('playing');
  }, [game]);

  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    const currentDifficulty = game.gameState?.difficulty ?? 'normal';
    if (currentWord) {
      const finalScore = calculateDifficultyScore(calculateScore(currentWord), currentDifficulty);
      setSessionScore((prev) => prev + finalScore);
      setWordsWon((prev) => prev + 1);
    }
    hasRecordedRef.current = false;
    startBroadcastSentRef.current = false;
    game.startGame();
  }, [game]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      if (!isMyTurn && phase === 'playing') {
        console.warn('[Coop] Not your turn!');
        return;
      }
      game.guess(letter);
      peer.sendMessage({ type: 'guess', payload: { letter } });
      if (peer.isHost) advanceTurn();
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
  }, [peer, setPlayers, setCurrentTurnIndex]);

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
    canPlay,
    maxPlayers: MAX_PLAYERS,
    gameState: game.gameState,
    displayWord: game.displayWord,
    sessionScore,
    wordsWon,
    wordScore,
    createRoom,
    joinRoom,
    startGame,
    continueSession,
    handleGuess,
    endSession,
  };
}
