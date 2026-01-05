'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCoopSession, CoopLobby, CoopWaiting, CoopGame } from '@/features/coop';
import { Leaderboard } from '@/components/game/Leaderboard';

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <p className="text-white">Chargement...</p>
    </main>
  );
}

function CoopContent() {
  const searchParams = useSearchParams();
  const [playerName, setPlayerName] = useState('');
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
