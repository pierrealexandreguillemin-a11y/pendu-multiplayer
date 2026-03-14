/**
 * PvP Message Handler - Peer message routing and processing
 */

import { useGameLogic } from '@/hooks/useGameLogic';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import type { GameMessage } from '@/types/game';
import type { PvPPhase } from './usePvPSession';
import type { PvPPlayer } from './usePvPRoom';
import { MAX_PLAYERS } from '@/types/room';

export interface PvPRefs {
  gameRef: React.MutableRefObject<ReturnType<typeof useGameLogic>>;
  phaseRef: React.MutableRefObject<PvPPhase>;
  playersRef: React.MutableRefObject<PvPPlayer[]>;
  currentTurnIndexRef: React.MutableRefObject<number>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

export interface PvPActions {
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

export function buildPvPMessageHandler(refs: PvPRefs, actions: PvPActions) {
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
