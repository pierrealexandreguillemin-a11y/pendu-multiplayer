'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';

interface PvPLobbyProps {
  playerName: string;
  joinId: string;
  isConnecting?: boolean;
  error?: string | null;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function PvPLobby({
  playerName,
  joinId,
  isConnecting = false,
  error = null,
  onPlayerNameChange,
  onJoinIdChange,
  onCreateRoom,
  onJoinRoom,
}: PvPLobbyProps) {
  const canCreate = playerName.trim().length > 0 && !isConnecting;
  const canJoin = playerName.trim().length > 0 && joinId.trim().length > 0 && !isConnecting;

  return (
    <PageTransition>
      <GlassCard className="p-8 max-w-md w-full" spotlightColor="rgba(236, 72, 153, 0.15)">
        <h1 className="text-2xl font-bold text-white text-center mb-6">Mode PvP</h1>
        <p className="text-gray-400 text-center text-sm mb-6">
          Un joueur choisit le mot, les autres devinent !
        </p>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="pvp-name" className="block text-sm text-gray-400">
              Ton pseudo
            </label>
            <Input
              id="pvp-name"
              placeholder="Ex: Marie"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              disabled={isConnecting}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-50"
              aria-required="true"
            />
          </div>

          <div className="space-y-3">
            <Button
              onClick={onCreateRoom}
              disabled={!canCreate}
              className="w-full bg-pink-700 hover:bg-pink-800 hover:shadow-lg hover:shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="text-white" />
                  Connexion...
                </span>
              ) : (
                'Je choisis le mot'
              )}
            </Button>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-gray-400 text-sm">ou</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <div className="space-y-1">
              <label htmlFor="pvp-code" className="block text-sm text-gray-400">
                Code de la partie
              </label>
              <Input
                id="pvp-code"
                placeholder="Colle le code ici"
                value={joinId}
                onChange={(e) => onJoinIdChange(e.target.value)}
                disabled={isConnecting}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-50"
              />
            </div>
            <Button
              onClick={onJoinRoom}
              disabled={!canJoin}
              variant="outline"
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Connexion...
                </span>
              ) : (
                'Je devine'
              )}
            </Button>
          </div>

          <Link
            href="/"
            className={`block text-center text-gray-400 hover:text-white py-2 ${isConnecting ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={isConnecting || undefined}
          >
            ← Retour
          </Link>
        </div>
      </GlassCard>
    </PageTransition>
  );
}
