'use client';

import { useState } from 'react';
import { useSoloSession, SoloStartScreen, SoloGameScreen } from '@/features/solo';
import { Leaderboard } from '@/components/game/Leaderboard';
import { usePlayerName } from '@/hooks/usePlayerName';

/** Solo Page - Thin orchestrator */
export default function SoloPage() {
  // ISO/IEC 25010 - Usability: Auto-fill from localStorage
  const [playerName, setPlayerName] = usePlayerName();
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
          difficultyConfig={session.difficultyConfig}
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
