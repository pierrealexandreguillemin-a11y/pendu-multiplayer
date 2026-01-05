'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useGameLogic } from '@/hooks/useGameLogic';
import { HangmanDrawing } from '@/components/game/HangmanDrawing';
import { WordDisplay } from '@/components/game/WordDisplay';
import { Keyboard } from '@/components/game/Keyboard';
import { GameStatus } from '@/components/game/GameStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Letter } from '@/types/game';
import Link from 'next/link';

type GamePhase = 'lobby' | 'waiting' | 'playing';

export default function CoopPage() {
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [joinId, setJoinId] = useState('');
  const [playerName, setPlayerName] = useState('');

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

  // Handle incoming messages
  useEffect(() => {
    onMessage((message) => {
      if (message.type === 'start' && !isHost) {
        const { word, category } = message.payload as { word: string; category: string };
        startGame(word, category);
        setPhase('playing');
      } else if (message.type === 'guess') {
        const { letter } = message.payload as { letter: Letter };
        guess(letter);
      } else if (message.type === 'state' && !isHost) {
        // Sync state from host
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
    startGame();
    if (gameState) {
      sendMessage({
        type: 'start',
        payload: { word: gameState.word, category: gameState.category },
      });
    }
    setPhase('playing');
  };

  const handleGuess = useCallback(
    (letter: Letter) => {
      guess(letter);
      sendMessage({ type: 'guess', payload: { letter } });
    },
    [guess, sendMessage]
  );

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
              <div className="p-4 bg-white/10 rounded-lg">
                <p className="text-3xl font-mono text-green-400 select-all">{peerId}</p>
                <p className="text-gray-400 text-sm mt-2">Les autres joueurs entrent ce code</p>
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

            <Button onClick={disconnect} variant="destructive" size="sm">
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
          onPlayAgain={() => {
            startGame();
            sendMessage({ type: 'restart', payload: {} });
          }}
          onBackToMenu={disconnect}
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
    </main>
  );
}
