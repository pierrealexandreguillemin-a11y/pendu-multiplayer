'use client';

import { useState } from 'react';
import { useSoloSession, SoloStartScreen, SoloGameScreen } from '@/features/solo';
import { Leaderboard } from '@/components/game/Leaderboard';

/** Solo Page - Thin orchestrator */
export default function SoloPage() {
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const session = useSoloSession({ playerName });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      {!session.gameState ? (
        <SoloStartScreen
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          onStart={session.startSession}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      ) : (
        <SoloGameScreen
          playerName={playerName}
          gameState={session.gameState}
          displayWord={session.displayWord}
          sessionScore={session.sessionScore}
          wordsWon={session.wordsWon}
          wordScore={session.wordScore}
          onGuess={session.guess}
          onContinue={session.continueSession}
          onEnd={session.endSession}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          mode="solo"
          onClose={() => setShowLeaderboard(false)}
          spotlightColor="rgba(59, 130, 246, 0.15)"
        />
      )}
    </main>
  );
}
