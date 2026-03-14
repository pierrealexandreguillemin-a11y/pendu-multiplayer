/**
 * Multiplayer Callbacks Hook - Shared user action handlers for multiplayer sessions
 * Provides createRoom, joinRoom, and endSession callbacks shared by coop and pvp.
 */

import { useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import type { MultiplayerPlayer } from '../types';

export interface MultiplayerCallbacksOptions {
  playerName: string;
  joinId: string;
  peer: ReturnType<typeof usePeerConnection>;
  setPlayers: React.Dispatch<React.SetStateAction<MultiplayerPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  setPhase: (phase: string) => void;
  setSessionScore: React.Dispatch<React.SetStateAction<number>>;
  setWordsWon: React.Dispatch<React.SetStateAction<number>>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
}

export function useMultiplayerCallbacks(opts: MultiplayerCallbacksOptions) {
  const {
    playerName,
    joinId,
    peer,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    startBroadcastSentRef,
  } = opts;

  const createRoom = useCallback(async () => {
    if (!playerName.trim()) return;
    const peerId = await peer.createRoom();
    setPlayers([{ id: peerId, name: playerName.trim(), isHost: true, isReady: true, score: 0 }]);
    setCurrentTurnIndex(0);
    setPhase('waiting');
  }, [playerName, peer, setPlayers, setCurrentTurnIndex, setPhase]);

  const joinRoom = useCallback(async () => {
    if (!playerName.trim() || !joinId.trim()) return;
    const myPeerId = await peer.joinRoom(joinId.trim());
    peer.sendMessage({
      type: 'player_join',
      payload: { playerId: myPeerId, playerName: playerName.trim() },
    });
    setPhase('waiting');
  }, [playerName, joinId, peer, setPhase]);

  const endSession = useCallback(() => {
    peer.disconnect();
    setPhase('lobby');
    setPlayers([]);
    setCurrentTurnIndex(0);
    setSessionScore(0);
    setWordsWon(0);
    startBroadcastSentRef.current = false;
  }, [
    peer,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    startBroadcastSentRef,
  ]);

  return { createRoom, joinRoom, endSession };
}
