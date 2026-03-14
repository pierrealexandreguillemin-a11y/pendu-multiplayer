/**
 * PvP Room Hook - Player roster and turn management
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';

export interface PvPPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
}

export interface PvPRoomState {
  players: PvPPlayer[];
  currentTurnIndex: number;
  broadcastPlayersUpdate: (playerList?: PvPPlayer[], turnIndex?: number) => void;
  advanceTurn: () => void;
  setPlayers: React.Dispatch<React.SetStateAction<PvPPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function usePvPRoom(peer: ReturnType<typeof usePeerConnection>): PvPRoomState {
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
