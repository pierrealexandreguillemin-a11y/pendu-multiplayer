/**
 * Multiplayer Room Hook - Player roster and turn management
 * Shared between coop and pvp modes, parameterized by turn strategy.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import type { MultiplayerPlayer } from '../types';

export interface MultiplayerRoomState {
  players: MultiplayerPlayer[];
  currentTurnIndex: number;
  broadcastPlayersUpdate: (playerList?: MultiplayerPlayer[], turnIndex?: number) => void;
  advanceTurn: () => void;
  setPlayers: React.Dispatch<React.SetStateAction<MultiplayerPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
}

interface UseMultiplayerRoomOptions {
  /** In pvp, turns cycle through guessers only (non-host players) */
  turnFilter?: (player: MultiplayerPlayer) => boolean;
}

export function useMultiplayerRoom(
  peer: ReturnType<typeof usePeerConnection>,
  options: UseMultiplayerRoomOptions = {}
): MultiplayerRoomState {
  const { turnFilter } = options;
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const playersRef = useRef(players);
  const currentTurnIndexRef = useRef(currentTurnIndex);
  useEffect(() => {
    playersRef.current = players;
    currentTurnIndexRef.current = currentTurnIndex;
  }, [players, currentTurnIndex]);

  const broadcastPlayersUpdate = useCallback(
    (playerList?: MultiplayerPlayer[], turnIndex?: number) => {
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
    const turnPlayers = turnFilter ? playersRef.current.filter(turnFilter) : playersRef.current;
    if (turnPlayers.length === 0) return;
    const nextIndex = (currentTurnIndexRef.current + 1) % turnPlayers.length;
    setCurrentTurnIndex(nextIndex);
    const nextPlayer = turnPlayers[nextIndex];
    if (nextPlayer && peer.isHost) {
      peer.sendMessage({
        type: 'turn_change',
        payload: { currentTurnIndex: nextIndex, currentPlayerId: nextPlayer.id },
      });
    }
  }, [peer, turnFilter]);

  useEffect(() => {
    const handleDisconnect = (disconnectedPeerId: string) => {
      if (!peer.isHost) return;
      const playerIndex = playersRef.current.findIndex((p) => p.id === disconnectedPeerId);
      if (playerIndex === -1) return;
      const updatedPlayers = playersRef.current.filter((p) => p.id !== disconnectedPeerId);
      setPlayers(updatedPlayers);

      const turnPlayers = turnFilter ? updatedPlayers.filter(turnFilter) : updatedPlayers;
      let newTurnIndex = currentTurnIndexRef.current;

      if (turnPlayers.length === 0) {
        newTurnIndex = 0;
      } else if (turnFilter) {
        // pvp mode: find guesser index of disconnected player
        const guesserIndex = playersRef.current
          .filter(turnFilter)
          .findIndex((p) => p.id === disconnectedPeerId);
        if (guesserIndex !== -1) {
          if (guesserIndex < currentTurnIndexRef.current)
            newTurnIndex = currentTurnIndexRef.current - 1;
          else if (guesserIndex === currentTurnIndexRef.current)
            newTurnIndex = currentTurnIndexRef.current % turnPlayers.length;
        }
      } else {
        // coop mode: use player index directly
        if (playerIndex < currentTurnIndexRef.current)
          newTurnIndex = currentTurnIndexRef.current - 1;
        else if (playerIndex === currentTurnIndexRef.current)
          newTurnIndex = currentTurnIndexRef.current % updatedPlayers.length;
      }

      setCurrentTurnIndex(newTurnIndex);
      broadcastPlayersUpdate(updatedPlayers, newTurnIndex);
    };
    peer.onPeerDisconnect(handleDisconnect);
    return () => {
      peer.offPeerDisconnect();
    };
  }, [peer, broadcastPlayersUpdate, turnFilter]);

  return {
    players,
    currentTurnIndex,
    broadcastPlayersUpdate,
    advanceTurn,
    setPlayers,
    setCurrentTurnIndex,
  };
}
