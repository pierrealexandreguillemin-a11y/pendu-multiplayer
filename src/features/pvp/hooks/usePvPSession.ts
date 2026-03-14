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
import type { Letter, GameMessage, LeaderboardEntry } from '@/types/game';
import { MAX_PLAYERS } from '@/types/room';

type AddEntryFn = (entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>) => void;

export type PvPPhase = 'lobby' | 'waiting' | 'word-input' | 'playing';

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

interface PvPRefs {
  gameRef: React.MutableRefObject<ReturnType<typeof useGameLogic>>;
  phaseRef: React.MutableRefObject<PvPPhase>;
  playersRef: React.MutableRefObject<PvPPlayer[]>;
  currentTurnIndexRef: React.MutableRefObject<number>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

interface PvPActions {
  isHost: boolean;
  sendMessage: ReturnType<typeof usePeerConnection>['sendMessage'];
  setPhase: (phase: PvPPhase) => void;
  setPlayers: (players: PvPPlayer[]) => void;
  setCurrentTurnIndex: (index: number) => void;
  advanceTurn: () => void;
  broadcastPlayersUpdate: (playerList?: PvPPlayer[], turnIndex?: number) => void;
}

function handlePvPStartMessage(
  payload: Extract<GameMessage, { type: 'start' }>['payload'],
  refs: PvPRefs,
  actions: PvPActions
) {
  if (!actions.isHost && refs.phaseRef.current !== 'playing') {
    refs.gameRef.current.startGame(payload.word, payload.category);
    actions.setPhase('playing');
  }
}

function handlePvPGuessMessage(
  payload: Extract<GameMessage, { type: 'guess' }>['payload'],
  refs: PvPRefs,
  actions: PvPActions
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

function handlePvPPlayerJoinMessage(
  payload: Extract<GameMessage, { type: 'player_join' }>['payload'],
  refs: PvPRefs,
  actions: PvPActions
) {
  if (!actions.isHost) return;
  const { playerId, playerName: newPlayerName } = payload;
  if (refs.playersRef.current.length >= MAX_PLAYERS) {
    console.warn('[PvP] Room is full, rejecting player:', playerId);
    return;
  }
  if (refs.playersRef.current.some((p) => p.id === playerId)) {
    console.warn('[PvP] Player already in room:', playerId);
    return;
  }
  const newPlayer: PvPPlayer = {
    id: playerId,
    name: newPlayerName,
    isHost: false,
    isReady: true,
    score: 0,
  };
  const updatedPlayers = [...refs.playersRef.current, newPlayer];
  actions.setPlayers(updatedPlayers);
  actions.broadcastPlayersUpdate(updatedPlayers, refs.currentTurnIndexRef.current);
  if (refs.phaseRef.current === 'playing' && refs.gameRef.current.gameState)
    refs.startBroadcastSentRef.current = false;
}

function buildPvPMessageHandler(refs: PvPRefs, actions: PvPActions) {
  return function handleMessage(message: GameMessage) {
    switch (message.type) {
      case 'start':
        handlePvPStartMessage(message.payload, refs, actions);
        break;
      case 'guess':
        handlePvPGuessMessage(message.payload, refs, actions);
        break;
      case 'restart':
        if (!actions.isHost) actions.setPhase('waiting');
        break;
      case 'state':
        break;
      case 'player_join':
        handlePvPPlayerJoinMessage(message.payload, refs, actions);
        break;
      case 'players_update':
        if (!actions.isHost) {
          actions.setPlayers(message.payload.players);
          actions.setCurrentTurnIndex(message.payload.currentTurnIndex);
        }
        break;
      case 'turn_change':
        if (!actions.isHost) actions.setCurrentTurnIndex(message.payload.currentTurnIndex);
        break;
    }
  };
}

interface PvPRoomState {
  players: PvPPlayer[];
  currentTurnIndex: number;
  broadcastPlayersUpdate: (playerList?: PvPPlayer[], turnIndex?: number) => void;
  advanceTurn: () => void;
  setPlayers: React.Dispatch<React.SetStateAction<PvPPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
}

function usePvPRoom(peer: ReturnType<typeof usePeerConnection>): PvPRoomState {
  const [players, setPlayers] = useState<PvPPlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const playersRef = useRef(players);
  const currentTurnIndexRef = useRef(currentTurnIndex);
  useEffect(() => {
    playersRef.current = players;
    currentTurnIndexRef.current = currentTurnIndex;
  }, [players, currentTurnIndex]);

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

  const advanceTurn = useCallback(() => {
    const guessersList = playersRef.current.filter((p) => !p.isHost);
    if (guessersList.length === 0) return;
    const nextIndex = (currentTurnIndexRef.current + 1) % guessersList.length;
    setCurrentTurnIndex(nextIndex);
    const nextGuesser = guessersList[nextIndex];
    if (nextGuesser && peer.isHost) {
      peer.sendMessage({
        type: 'turn_change',
        payload: { currentTurnIndex: nextIndex, currentPlayerId: nextGuesser.id },
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
      const updatedGuessers = updatedPlayers.filter((p) => !p.isHost);
      let newTurnIndex = currentTurnIndexRef.current;
      if (updatedGuessers.length === 0) newTurnIndex = 0;
      else {
        const guesserIndex = playersRef.current
          .filter((p) => !p.isHost)
          .findIndex((p) => p.id === disconnectedPeerId);
        if (guesserIndex !== -1) {
          if (guesserIndex < currentTurnIndexRef.current)
            newTurnIndex = currentTurnIndexRef.current - 1;
          else if (guesserIndex === currentTurnIndexRef.current)
            newTurnIndex = currentTurnIndexRef.current % updatedGuessers.length;
        }
      }
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

interface PvPEffectsOptions {
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

function usePvPEffects(opts: PvPEffectsOptions) {
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

  const refs: PvPRefs = {
    gameRef,
    phaseRef,
    playersRef,
    currentTurnIndexRef,
    startBroadcastSentRef,
  };
  const guessers = players.filter((p) => !p.isHost);
  const currentGuesser = guessers[currentTurnIndex] ?? null;
  const isMyTurn = !peer.isHost && currentGuesser?.id === peer.peerId;
  const difficulty = game.gameState?.difficulty ?? 'normal';
  const wordScore = game.gameState
    ? calculateDifficultyScore(calculateScore(game.gameState.word), difficulty)
    : 0;

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

  const createRoom = useCallback(async () => {
    if (!playerName.trim()) return;
    const peerId = await peer.createRoom();
    setPlayers([{ id: peerId, name: playerName.trim(), isHost: true, isReady: true, score: 0 }]);
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

  const goToWordInput = useCallback(() => {
    setPhase('word-input');
  }, []);
  const goBackToWaiting = useCallback(() => {
    setPhase('waiting');
  }, []);

  const startGameWithWord = useCallback(() => {
    if (!customWord.trim()) return;
    startBroadcastSentRef.current = false;
    game.startGame(customWord.trim(), customCategory.trim() || 'PvP');
    setPhase('playing');
  }, [customWord, customCategory, game]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      if (peer.isHost) {
        console.warn('[PvP] Host cannot guess!');
        return;
      }
      if (!isMyTurn && phase === 'playing') {
        console.warn('[PvP] Not your turn!');
        return;
      }
      game.guess(letter);
      peer.sendMessage({ type: 'guess', payload: { letter } });
    },
    [game, peer, isMyTurn, phase]
  );

  const continueSession = useCallback(() => {
    const currentWord = game.gameState?.word;
    const currentDifficulty = game.gameState?.difficulty ?? 'normal';
    if (currentWord && !peer.isHost) {
      setSessionScore(
        (prev) => prev + calculateDifficultyScore(calculateScore(currentWord), currentDifficulty)
      );
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
  }, [peer, setPlayers, setCurrentTurnIndex]);

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
