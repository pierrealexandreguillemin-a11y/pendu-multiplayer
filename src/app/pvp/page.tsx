'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePvPSession, PvPLobby, PvPWaiting, PvPWordInput, PvPGame } from '@/features/pvp';
import { Leaderboard } from '@/components/game/Leaderboard';

/** PvP Page - Thin orchestrator */
export default function PvPPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PvPContent />
    </Suspense>
  );
}

function Loading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
      </div>
      <p className="text-white">Chargement...</p>
    </main>
  );
}

function PvPContent() {
  const searchParams = useSearchParams();
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const session = usePvPSession({
    playerName,
    initialJoinId: searchParams.get('join') ?? '',
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      {session.phase === 'lobby' && (
        <PvPLobby
          playerName={playerName}
          joinId={session.joinId}
          onPlayerNameChange={setPlayerName}
          onJoinIdChange={session.setJoinId}
          onCreateRoom={session.createRoom}
          onJoinRoom={session.joinRoom}
        />
      )}

      {session.phase === 'waiting' && (
        <PvPWaiting
          peerId={session.peerId}
          isHost={session.isHost}
          status={session.status}
          connectedPeers={session.connectedPeers}
          onStartWordInput={session.goToWordInput}
          onQuit={session.endSession}
        />
      )}

      {session.phase === 'word-input' && session.isHost && (
        <PvPWordInput
          customWord={session.customWord}
          customCategory={session.customCategory}
          onWordChange={session.setCustomWord}
          onCategoryChange={session.setCustomCategory}
          onStart={session.startGameWithWord}
          onBack={session.goBackToWaiting}
        />
      )}

      {session.phase === 'playing' && session.gameState && (
        <PvPGame
          gameState={session.gameState}
          displayWord={session.displayWord}
          isHost={session.isHost}
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
          mode="pvp"
          onClose={() => setShowLeaderboard(false)}
          spotlightColor="rgba(236, 72, 153, 0.15)"
        />
      )}
    </main>
  );
}
