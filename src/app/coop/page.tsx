'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { HangmanDrawing } from '@/components/game/HangmanDrawing';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import { Leaderboard } from '@/components/game/Leaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateScore } from '@/lib/game-engine';
import { useLeaderboardStore } from '@/stores/leaderboard';
import type { Letter } from '@/types/game';
import Link from 'next/link';

type GamePhase = 'lobby' | 'waiting' | 'playing';

/** Main page component wrapped in Suspense for useSearchParams */
export default function CoopPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
          <p className="text-white">Chargement...</p>
        </main>
      }
    >
      <CoopContent />
    </Suspense>
  );
}

/** Actual coop game content */
function CoopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize joinId from URL query param (from QR code scan)
  const initialJoinId = searchParams.get('join') ?? '';

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [joinId, setJoinId] = useState(initialJoinId);
  const [playerName, setPlayerName] = useState('');

  // Generate join URL for QR code
  const getJoinUrl = useCallback((id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/coop?join=${id}`;
  }, []);

  const {
    peerId,
    status,
    isHost,
    connectedPeers,
    createRoom,
    joinRoom,
    sendMessage,
    onMessage,
    disconnect,
  } = usePeerConnection();

  const { gameState, displayWord, startGame, guess } = useGameLogic();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { addEntry } = useLeaderboardStore();
  const hasRecordedRef = useRef(false);

  // Calculate score
  const score = gameState?.status === 'won' ? calculateScore(gameState.word) : 0;
  const gameEnded = gameState?.status === 'won' || gameState?.status === 'lost';

  // Record score when game ends (victory or defeat)
  useEffect(() => {
    if (gameEnded && playerName && !hasRecordedRef.current && gameState) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: 'coop',
        score: gameState.status === 'won' ? calculateScore(gameState.word) : 0,
        word: gameState.originalWord,
        errors: gameState.errors,
        won: gameState.status === 'won',
      });
    }
  }, [gameEnded, gameState, playerName, addEntry]);

  // Handle incoming messages (type-safe via discriminated unions)
  useEffect(() => {
    onMessage((message) => {
      switch (message.type) {
        case 'start':
          if (!isHost) {
            startGame(message.payload.word, message.payload.category);
            setPhase('playing');
          }
          break;
        case 'guess':
          guess(message.payload.letter);
          break;
        case 'state':
          // TODO: Sync state from host for late joiners
          break;
        case 'restart':
          startGame();
          setPhase('playing');
          break;
      }
    });
  }, [onMessage, isHost, startGame, guess]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;
    await createRoom();
    setPhase('waiting');
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !joinId.trim()) return;
    await joinRoom(joinId.trim());
    setPhase('waiting');
  };

  const handleStartGame = () => {
    hasRecordedRef.current = false;
    startGame();
    // Note: startGame() updates gameState asynchronously,
    // so we need to send message after state update
    setPhase('playing');
  };

  // Send start message when game starts as host
  useEffect(() => {
    if (isHost && phase === 'playing' && gameState) {
      sendMessage({
        type: 'start',
        payload: { word: gameState.word, category: gameState.category ?? '' },
      });
    }
  }, [isHost, phase, gameState, sendMessage]);

  const handleGuess = useCallback(
    (letter: Letter) => {
      guess(letter);
      sendMessage({ type: 'guess', payload: { letter } });
    },
    [guess, sendMessage]
  );

  // Quit game and return to home
  const handleQuit = useCallback(() => {
    disconnect();
    router.push('/');
  }, [disconnect, router]);

  // Lobby Phase
  if (phase === 'lobby') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <Card className="w-full max-w-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">Mode Coop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              placeholder="Ton pseudo"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />

            <div className="space-y-3">
              <Button
                onClick={handleCreateRoom}
                className="w-full bg-green-500 hover:bg-green-600"
                size="lg"
              >
                Créer une partie
              </Button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-gray-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <Input
                placeholder="Code de la partie"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button onClick={handleJoinRoom} variant="outline" className="w-full" size="lg">
                Rejoindre
              </Button>
            </div>

            <Link href="/" className="block text-center text-gray-400 hover:text-white">
              ← Retour
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Waiting Phase
  if (phase === 'waiting') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <Card className="w-full max-w-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-xl text-white text-center">
              {isHost ? 'Partage ce code' : 'En attente...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {isHost && peerId && (
              <div className="space-y-4">
                {/* QR Code - scan to join */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl">
                    <QRCodeSVG
                      value={getJoinUrl(peerId)}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>
                <p className="text-gray-400 text-sm">Scanne pour rejoindre</p>

                {/* Fallback: show code */}
                <details className="text-left">
                  <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300">
                    Ou entre le code manuellement
                  </summary>
                  <div className="mt-2 p-2 bg-white/10 rounded text-center">
                    <p className="text-sm font-mono text-green-400 select-all break-all">
                      {peerId}
                    </p>
                  </div>
                </details>
              </div>
            )}

            <div className="text-white">
              <p>Joueurs connectés: {connectedPeers.length + 1}</p>
              <p className="text-sm text-gray-400">Status: {status}</p>
            </div>

            {isHost && connectedPeers.length > 0 && (
              <Button
                onClick={handleStartGame}
                className="w-full bg-green-500 hover:bg-green-600"
                size="lg"
              >
                Lancer la partie!
              </Button>
            )}

            <Button onClick={handleQuit} variant="destructive" size="sm">
              Quitter
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Playing Phase
  if (!gameState) return null;

  const isGameOver = gameState.status !== 'playing';

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">
            Coop ({connectedPeers.length + 1} joueurs)
          </h1>
          <span className={`text-sm ${status === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
            {status === 'connected' ? '● Connecté' : '○ Déconnecté'}
          </span>
        </div>

        <GameStatus
          status={gameState.status}
          errors={gameState.errors}
          category={gameState.category}
          score={score}
          onPlayAgain={() => {
            hasRecordedRef.current = false;
            startGame();
            sendMessage({ type: 'restart', payload: {} });
          }}
          onBackToMenu={handleQuit}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />

        <div className="my-6 text-white">
          <HangmanDrawing errors={gameState.errors} />
        </div>

        <div className="mb-6 text-white">
          <WordDisplay
            displayWord={displayWord}
            status={gameState.status}
            originalWord={isGameOver ? gameState.originalWord : undefined}
          />
        </div>

        {!isGameOver && (
          <Keyboard
            correctLetters={gameState.correctLetters}
            wrongLetters={gameState.wrongLetters}
            onLetterClick={handleGuess}
          />
        )}
      </div>

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
