'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCoopSession, CoopLobby, CoopWaiting, CoopGame } from '@/features/coop';
import { Leaderboard } from '@/components/game/Leaderboard';
import { usePlayerName } from '@/hooks/usePlayerName';

/** Coop Page - Thin orchestrator */
export default function CoopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CoopContent />
    </Suspense>
  );
}

function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
      </div>
      <p className="text-white">Chargement...</p>
    </main>
  );
}

function CoopContent() {
  const searchParams = useSearchParams();
  // ISO/IEC 25010 - Usability: Auto-fill from localStorage
  const [playerName, setPlayerName] = usePlayerName();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const session = useCoopSession({
    playerName,
    initialJoinId: searchParams.get('join') ?? '',
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      {session.phase === 'lobby' && (
        <CoopLobby
          playerName={playerName}
          joinId={session.joinId}
          isConnecting={session.status === 'connecting'}
          error={session.error}
          onPlayerNameChange={setPlayerName}
          onJoinIdChange={session.setJoinId}
          onCreateRoom={session.createRoom}
          onJoinRoom={session.joinRoom}
        />
      )}

      {session.phase === 'waiting' && (
        <CoopWaiting
          peerId={session.peerId}
          isHost={session.isHost}
          status={session.status}
          connectedPeers={session.connectedPeers}
          onStart={session.startGame}
          onQuit={session.endSession}
        />
      )}

      {session.phase === 'playing' && session.gameState && (
        <CoopGame
          gameState={session.gameState}
          displayWord={session.displayWord}
          status={session.status}
          connectedPeers={session.connectedPeers}
          sessionScore={session.sessionScore}
          wordsWon={session.wordsWon}
          wordScore={session.wordScore}
          onGuess={session.handleGuess}
          onContinue={session.continueSession}
          onQuit={session.endSession}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          mode="coop"
          onClose={() => setShowLeaderboard(false)}
          spotlightColor="rgba(74, 222, 128, 0.15)"
        />
      )}
    </main>
  );
}
