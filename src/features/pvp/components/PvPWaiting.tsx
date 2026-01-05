'use client';

import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '@/components/effects/glass-card';
import { Button } from '@/components/ui/button';
import type { ConnectionStatus } from '@/types/game';

interface PvPWaitingProps {
  peerId: string | null;
  isHost: boolean;
  status: ConnectionStatus;
  connectedPeers: string[];
  onStartWordInput: () => void;
  onQuit: () => void;
}

export function PvPWaiting({
  peerId,
  isHost,
  status,
  connectedPeers,
  onStartWordInput,
  onQuit,
}: PvPWaitingProps) {
  const getJoinUrl = (id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/pvp?join=${id}`;
  };

  return (
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
          onClick={onStartWordInput}
          className="w-full bg-pink-500 hover:bg-pink-600 mb-4"
          size="lg"
        >
          Choisir le mot
        </Button>
      )}

      <Button onClick={onQuit} variant="destructive" size="sm">
        Quitter
      </Button>
    </GlassCard>
  );
}
