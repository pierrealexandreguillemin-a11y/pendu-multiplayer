'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';

interface MultiplayerLobbyProps {
  playerName: string;
  joinId: string;
  isConnecting?: boolean;
  error?: string | null;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  /** Mode title (e.g. "Mode Coop", "Mode PvP") */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Spotlight color for the glass card */
  spotlightColor: string;
  /** Button color classes for the create room button */
  createButtonClass: string;
  /** Label for the create room button */
  createButtonLabel: string;
  /** Label for the join room button */
  joinButtonLabel: string;
  /** Input ID prefix for accessibility (e.g. "coop", "pvp") */
  idPrefix: string;
}

function ConnectingLabel({ white }: { white?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Spinner className={white ? 'text-white' : undefined} />
      Connexion...
    </span>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-white/20" />
      <span className="text-gray-400 text-sm">ou</span>
      <div className="flex-1 h-px bg-white/20" />
    </div>
  );
}

export function MultiplayerLobby({
  playerName,
  joinId,
  isConnecting = false,
  error = null,
  onPlayerNameChange,
  onJoinIdChange,
  onCreateRoom,
  onJoinRoom,
  title,
  subtitle,
  spotlightColor,
  createButtonClass,
  createButtonLabel,
  joinButtonLabel,
  idPrefix,
}: MultiplayerLobbyProps) {
  const canCreate = playerName.trim().length > 0 && !isConnecting;
  const canJoin = playerName.trim().length > 0 && joinId.trim().length > 0 && !isConnecting;

  return (
    <PageTransition>
      <GlassCard className="p-8 max-w-md w-full" spotlightColor={spotlightColor}>
        <h1 className="text-2xl font-bold text-white text-center mb-6">{title}</h1>
        {subtitle && <p className="text-gray-400 text-center text-sm mb-6">{subtitle}</p>}

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-name`} className="block text-sm text-gray-400">
              Ton pseudo
            </label>
            <Input
              id={`${idPrefix}-name`}
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
              className={`w-full disabled:opacity-50 disabled:cursor-not-allowed ${createButtonClass}`}
              size="lg"
            >
              {isConnecting ? <ConnectingLabel white /> : createButtonLabel}
            </Button>

            <Divider />

            <div className="space-y-1">
              <label htmlFor={`${idPrefix}-code`} className="block text-sm text-gray-400">
                Code de la partie
              </label>
              <Input
                id={`${idPrefix}-code`}
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
              {isConnecting ? <ConnectingLabel /> : joinButtonLabel}
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
