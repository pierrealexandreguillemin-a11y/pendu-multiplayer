'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '@/components/effects/glass-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ConnectionStatus } from '@/types/game';
import { MAX_PLAYERS } from '@/types/room';

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
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

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
            <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-200">
              Ou entre le code manuellement
            </summary>
            <div className="mt-2 p-2 bg-white/10 rounded text-center">
              <p className="text-sm font-mono text-pink-400 select-all break-all">{peerId}</p>
            </div>
          </details>
        </div>
      )}

      {/* ISO/IEC 25010 - Clear player count with max limit */}
      <div className="text-white mb-6">
        <p>
          Joueurs: {connectedPeers.length + 1}/{MAX_PLAYERS}
        </p>
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

      <Button onClick={() => setShowQuitConfirm(true)} variant="destructive" size="sm">
        Quitter
      </Button>

      {/* ISO/IEC 25065 - Confirmation before destructive action */}
      <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Quitter la partie ?</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isHost
                ? 'Les autres joueurs seront déconnectés. Cette action est irréversible.'
                : 'Tu seras déconnecté de la partie.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowQuitConfirm(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={onQuit}>
              Quitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
