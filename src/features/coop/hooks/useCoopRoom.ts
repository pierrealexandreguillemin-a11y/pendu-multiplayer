/**
 * Coop Room Hook - Player roster and turn management
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';

export interface CoopPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

export interface CoopRoomState {
  players: CoopPlayer[];
  currentTurnIndex: number;
  broadcastPlayersUpdate: (playerList?: CoopPlayer[], turnIndex?: number) => void;
  advanceTurn: () => void;
  setPlayers: React.Dispatch<React.SetStateAction<CoopPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function useCoopRoom(peer: ReturnType<typeof usePeerConnection>): CoopRoomState {
  const [players, setPlayers] = useState<CoopPlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const playersRef = useRef(players);
  const currentTurnIndexRef = useRef(currentTurnIndex);
  useEffect(() => {
    playersRef.current = players;
    currentTurnIndexRef.current = currentTurnIndex;
  }, [players, currentTurnIndex]);

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
