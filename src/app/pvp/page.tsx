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
import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculateScore } from '@/lib/game-engine';
import { useLeaderboardStore } from '@/stores/leaderboard';
import type { Letter } from '@/types/game';
import Link from 'next/link';

type GamePhase = 'lobby' | 'waiting' | 'word-input' | 'playing';

/** Main page component wrapped in Suspense for useSearchParams */
export default function PvPPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
          <p className="text-white">Chargement...</p>
        </main>
      }
    >
      <PvPContent />
    </Suspense>
  );
}

/** Actual PvP game content */
function PvPContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialJoinId = searchParams.get('join') ?? '';

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [joinId, setJoinId] = useState(initialJoinId);
  const [playerName, setPlayerName] = useState('');
  const [customWord, setCustomWord] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const getJoinUrl = useCallback((id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/pvp?join=${id}`;
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

  // Calculate score (only for guessers, not host)
  const score = gameState?.status === 'won' && !isHost ? calculateScore(gameState.word) : 0;
  const gameEnded = gameState?.status === 'won' || gameState?.status === 'lost';

  // Record score when guesser's game ends (victory or defeat)
  useEffect(() => {
    if (gameEnded && !isHost && playerName && !hasRecordedRef.current && gameState) {
      hasRecordedRef.current = true;
      addEntry({
        playerName,
        mode: 'pvp',
        score: gameState.status === 'won' ? calculateScore(gameState.word) : 0,
        word: gameState.originalWord,
        errors: gameState.errors,
        won: gameState.status === 'won',
      });
    }
  }, [gameEnded, gameState, isHost, playerName, addEntry]);

  // Handle incoming messages
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
        case 'restart':
          if (!isHost) {
            setPhase('waiting');
          }
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

  const handleStartWordInput = () => {
    setPhase('word-input');
  };

  const handleStartGame = () => {
    if (!customWord.trim()) return;
    startGame(customWord.trim(), customCategory.trim() || 'PvP');
    setPhase('playing');
  };

  // Send start message when game starts as host
  useEffect(() => {
    if (isHost && phase === 'playing' && gameState) {
      sendMessage({
        type: 'start',
        payload: { word: gameState.word, category: gameState.category ?? 'PvP' },
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

  const handleQuit = useCallback(() => {
    disconnect();
    router.push('/');
  }, [disconnect, router]);

  const handlePlayAgain = () => {
    hasRecordedRef.current = false;
    setCustomWord('');
    setCustomCategory('');
    setPhase('word-input');
    sendMessage({ type: 'restart', payload: {} });
  };

  // Lobby Phase
  if (phase === 'lobby') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <PageTransition>
          <GlassCard className="p-8 max-w-md w-full" spotlightColor="rgba(236, 72, 153, 0.15)">
            <h1 className="text-2xl font-bold text-white text-center mb-6">Mode PvP</h1>
            <p className="text-gray-400 text-center text-sm mb-6">
              Un joueur choisit le mot, les autres devinent !
            </p>

            <div className="space-y-6">
              <Input
                placeholder="Ton pseudo"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />

              <div className="space-y-3">
                <Button
                  onClick={handleCreateRoom}
                  className="w-full bg-pink-500 hover:bg-pink-600 hover:shadow-lg hover:shadow-pink-500/30"
                  size="lg"
                >
                  Je choisis le mot
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
                  Je devine
                </Button>
              </div>

              <Link href="/" className="block text-center text-gray-400 hover:text-white">
                ← Retour
              </Link>
            </div>
          </GlassCard>
        </PageTransition>
      </main>
    );
  }

  // Waiting Phase (Host waiting for players)
  if (phase === 'waiting') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <GlassCard
          className="p-8 max-w-md w-full text-center"
          spotlightColor="rgba(236, 72, 153, 0.15)"
        >
          <h2 className="text-xl font-bold text-white mb-6">
            {isHost ? 'Invite des joueurs' : 'En attente du mot...'}
          </h2>

          {isHost && peerId && (
            <div className="space-y-4 mb-6">
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl">
                  <QRCodeSVG value={getJoinUrl(peerId)} size={140} level="M" />
                </div>
              </div>
              <p className="text-gray-400 text-sm">Scanne pour rejoindre</p>

              <details className="text-left">
                <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300">
                  Ou entre le code manuellement
                </summary>
                <div className="mt-2 p-2 bg-white/10 rounded text-center">
                  <p className="text-sm font-mono text-pink-400 select-all break-all">{peerId}</p>
                </div>
              </details>
            </div>
          )}

          <div className="text-white mb-6">
            <p>Joueurs connectés: {connectedPeers.length + 1}</p>
            <p className="text-sm text-gray-400">Status: {status}</p>
          </div>

          {isHost && connectedPeers.length > 0 && (
            <Button
              onClick={handleStartWordInput}
              className="w-full bg-pink-500 hover:bg-pink-600 mb-4"
              size="lg"
            >
              Choisir le mot
            </Button>
          )}

          <Button onClick={handleQuit} variant="destructive" size="sm">
            Quitter
          </Button>
        </GlassCard>
      </main>
    );
  }

  // Word Input Phase (Host enters the word)
  if (phase === 'word-input' && isHost) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <GlassCard className="p-8 max-w-md w-full" spotlightColor="rgba(236, 72, 153, 0.15)">
          <h2 className="text-xl font-bold text-white text-center mb-6">Choisis ton mot</h2>

          <div className="space-y-4">
            <Input
              placeholder="Le mot à deviner"
              value={customWord}
              onChange={(e) => setCustomWord(e.target.value.toUpperCase())}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center text-xl font-mono"
              autoComplete="off"
            />

            <Input
              placeholder="Indice (optionnel)"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />

            <p className="text-gray-500 text-xs text-center">
              Les accents seront ignorés pour les devinettes
            </p>

            <Button
              onClick={handleStartGame}
              disabled={!customWord.trim()}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50"
              size="lg"
            >
              C&apos;est parti !
            </Button>

            <Button
              onClick={() => setPhase('waiting')}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Retour
            </Button>
          </div>
        </GlassCard>
      </main>
    );
  }

  // Playing Phase
  if (!gameState) return null;

  const isGameOver = gameState.status !== 'playing';

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <GlassCard
        className="p-6 sm:p-8 max-w-lg w-full"
        hoverScale={false}
        spotlightColor="rgba(236, 72, 153, 0.1)"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">PvP {isHost && '(Tu fais deviner)'}</h1>
          <span className={`text-sm ${status === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
            {connectedPeers.length + 1} joueurs
          </span>
        </div>

        {/* Host sees the word */}
        {isHost && (
          <div className="mb-4 p-3 bg-pink-500/20 rounded-lg text-center">
            <p className="text-pink-300 text-sm">Ton mot :</p>
            <p className="text-white font-bold text-xl">{gameState.originalWord}</p>
          </div>
        )}

        <GameStatus
          status={gameState.status}
          errors={gameState.errors}
          category={gameState.category}
          score={score}
          onPlayAgain={isHost ? handlePlayAgain : undefined}
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

        {/* Only non-host players can guess */}
        {!isGameOver && !isHost && (
          <Keyboard
            correctLetters={gameState.correctLetters}
            wrongLetters={gameState.wrongLetters}
            onLetterClick={handleGuess}
          />
        )}

        {/* Host sees keyboard but disabled */}
        {!isGameOver && isHost && (
          <p className="text-center text-gray-500 text-sm">Attends que les autres devinent...</p>
        )}
      </GlassCard>

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
