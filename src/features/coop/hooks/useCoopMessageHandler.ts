/**
 * Coop Message Handler - Peer message routing and processing
 */

import { useGameLogic } from '@/hooks/useGameLogic';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import type { GameMessage } from '@/types/game';
import type { CoopPhase } from './useCoopSession';
import type { CoopPlayer } from './useCoopRoom';
import { MAX_PLAYERS } from '@/types/room';

export interface CoopRefs {
  gameRef: React.MutableRefObject<ReturnType<typeof useGameLogic>>;
  phaseRef: React.MutableRefObject<CoopPhase>;
  playersRef: React.MutableRefObject<CoopPlayer[]>;
  currentTurnIndexRef: React.MutableRefObject<number>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

export interface CoopActions {
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
  if (refs.phaseRef.current === 'playing' && refs.gameRef.current.gameState)
    refs.startBroadcastSentRef.current = false;
}

export function buildCoopMessageHandler(refs: CoopRefs, actions: CoopActions) {
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
