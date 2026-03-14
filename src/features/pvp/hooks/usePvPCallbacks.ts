/**
 * PvP Callbacks Hook - User action handlers for PvP session
 */

import { useCallback } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import type { Letter } from '@/types/game';
import type { PvPPhase } from './usePvPSession';
import type { PvPPlayer } from './usePvPRoom';
import { usePvPSessionActions } from './usePvPSessionActions';

export interface PvPCallbacksOptions {
  playerName: string;
  joinId: string;
  customWord: string;
  customCategory: string;
  peer: ReturnType<typeof usePeerConnection>;
  game: ReturnType<typeof useGameLogic>;
  isMyTurn: boolean;
  phase: PvPPhase;
  setPlayers: React.Dispatch<React.SetStateAction<PvPPlayer[]>>;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  setPhase: (phase: PvPPhase) => void;
  setSessionScore: React.Dispatch<React.SetStateAction<number>>;
  setWordsWon: React.Dispatch<React.SetStateAction<number>>;
  setCustomWord: React.Dispatch<React.SetStateAction<string>>;
  setCustomCategory: React.Dispatch<React.SetStateAction<string>>;
  startBroadcastSentRef: React.MutableRefObject<boolean>;
  hasRecordedRef: React.MutableRefObject<boolean>;
}

export function usePvPCallbacks(opts: PvPCallbacksOptions) {
  const {
    playerName,
    joinId,
    customWord,
    customCategory,
    peer,
    game,
    isMyTurn,
    phase,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    setCustomWord,
    setCustomCategory,
    startBroadcastSentRef,
    hasRecordedRef,
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

  const goToWordInput = useCallback(() => setPhase('word-input'), [setPhase]);
  const goBackToWaiting = useCallback(() => setPhase('waiting'), [setPhase]);

  const startGameWithWord = useCallback(() => {
    if (!customWord.trim()) return;
    startBroadcastSentRef.current = false;
    game.startGame(customWord.trim(), customCategory.trim() || 'PvP');
    setPhase('playing');
  }, [customWord, customCategory, game, setPhase, startBroadcastSentRef]);

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

  const { continueSession, endSession } = usePvPSessionActions({
    game,
    peer,
    setPlayers,
    setCurrentTurnIndex,
    setPhase,
    setSessionScore,
    setWordsWon,
    setCustomWord,
    setCustomCategory,
    startBroadcastSentRef,
    hasRecordedRef,
  });

  return {
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
