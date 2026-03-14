/**
 * Multiplayer Message Handler - Peer message routing and processing
 * Shared between coop and pvp modes with mode-specific overrides.
 */

import { useGameLogic } from '@/hooks/useGameLogic';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import type { GameMessage } from '@/types/game';
import type { MultiplayerPlayer } from '../types';
import { MAX_PLAYERS } from '@/types/room';

export interface MultiplayerRefs {
  gameRef: React.MutableRefObject<ReturnType<typeof useGameLogic>>;
  phaseRef: React.MutableRefObject<string>;
  playersRef: React.MutableRefObject<MultiplayerPlayer[]>;
  currentTurnIndexRef: React.MutableRefObject<number>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

export interface MultiplayerActions {
  isHost: boolean;
  sendMessage: ReturnType<typeof usePeerConnection>['sendMessage'];
  setPhase: (phase: string) => void;
  setPlayers: (players: MultiplayerPlayer[]) => void;
  setCurrentTurnIndex: (index: number) => void;
  advanceTurn: () => void;
  broadcastPlayersUpdate: (playerList?: MultiplayerPlayer[], turnIndex?: number) => void;
}

export interface MessageHandlerOverrides {
  /** Label for log messages (e.g. 'Coop' or 'PvP') */
  logPrefix: string;
  /** Handle restart message. Coop: startGame + setPhase('playing'). PvP: setPhase('waiting'). */
  onRestart: (refs: MultiplayerRefs, actions: MultiplayerActions) => void;
  /** Whether turn_change requires !isHost check (pvp does, coop does not) */
  turnChangeRequiresNonHost?: boolean;
}

function handleStartMessage(
  payload: Extract<GameMessage, { type: 'start' }>['payload'],
  refs: MultiplayerRefs,
  actions: MultiplayerActions
) {
  if (!actions.isHost && refs.phaseRef.current !== 'playing') {
    refs.gameRef.current.startGame(payload.word, payload.category);
    actions.setPhase('playing');
  }
}

function handleGuessMessage(
  payload: Extract<GameMessage, { type: 'guess' }>['payload'],
  refs: MultiplayerRefs,
  actions: MultiplayerActions
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
  refs: MultiplayerRefs,
  actions: MultiplayerActions,
  logPrefix: string
) {
  if (!actions.isHost) return;
  const { playerId, playerName: newPlayerName } = payload;
  if (refs.playersRef.current.length >= MAX_PLAYERS) {
    console.warn(`[${logPrefix}] Room is full, rejecting player:`, playerId);
    return;
  }
  if (refs.playersRef.current.some((p) => p.id === playerId)) {
    console.warn(`[${logPrefix}] Player already in room:`, playerId);
    return;
  }
  const newPlayer: MultiplayerPlayer = {
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

export function buildMultiplayerMessageHandler(
  refs: MultiplayerRefs,
  actions: MultiplayerActions,
  overrides: MessageHandlerOverrides
) {
  return function handleMessage(message: GameMessage) {
    switch (message.type) {
      case 'start':
        handleStartMessage(message.payload, refs, actions);
        break;
      case 'guess':
        handleGuessMessage(message.payload, refs, actions);
        break;
      case 'restart':
        overrides.onRestart(refs, actions);
        break;
      case 'state':
        break;
      case 'player_join':
        handlePlayerJoinMessage(message.payload, refs, actions, overrides.logPrefix);
        break;
      case 'players_update':
        if (!actions.isHost) {
          actions.setPlayers(message.payload.players);
          actions.setCurrentTurnIndex(message.payload.currentTurnIndex);
        }
        break;
      case 'turn_change':
        if (overrides.turnChangeRequiresNonHost) {
          if (!actions.isHost) actions.setCurrentTurnIndex(message.payload.currentTurnIndex);
        } else {
          actions.setCurrentTurnIndex(message.payload.currentTurnIndex);
        }
        break;
    }
  };
}
