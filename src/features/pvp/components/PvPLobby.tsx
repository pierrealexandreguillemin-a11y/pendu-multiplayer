'use client';

import { GlassCard } from '@/components/effects/glass-card';
import { PageTransition } from '@/components/effects/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface PvPLobbyProps {
  playerName: string;
  joinId: string;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function PvPLobby({
  playerName,
  joinId,
  onPlayerNameChange,
  onJoinIdChange,
  onCreateRoom,
  onJoinRoom,
}: PvPLobbyProps) {
  return (
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
            onChange={(e) => onPlayerNameChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />

          <div className="space-y-3">
            <Button
              onClick={onCreateRoom}
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
              onChange={(e) => onJoinIdChange(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Button onClick={onJoinRoom} variant="outline" className="w-full" size="lg">
              Je devine
            </Button>
          </div>

          <Link href="/" className="block text-center text-gray-400 hover:text-white">
            ← Retour
          </Link>
        </div>
      </GlassCard>
    </PageTransition>
  );
}
