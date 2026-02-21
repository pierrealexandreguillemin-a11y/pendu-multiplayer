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
import { CONNECTION_STATUS_LABELS } from '@/types/game';
import type { ConnectionStatus } from '@/types/game';
import { MAX_PLAYERS } from '@/types/room';

interface CoopWaitingProps {
  peerId: string | null;
  isHost: boolean;
  status: ConnectionStatus;
  connectedPeers: string[];
  onStart: () => void;
  onQuit: () => void;
}

export function CoopWaiting({
  peerId,
  isHost,
  status,
  connectedPeers,
  onStart,
  onQuit,
}: CoopWaitingProps) {
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const canStart = isHost && connectedPeers.length > 0;

  const getJoinUrl = (id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/coop?join=${id}`;
  };

  return (
    <GlassCard className="p-8 max-w-md w-full text-center" spotlightColor="rgba(34, 197, 94, 0.15)">
      <h2 className="text-xl font-bold text-white mb-6">
        {isHost ? 'Partage ce code' : 'En attente...'}
      </h2>

      {isHost && peerId && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-xl">
              <QRCodeSVG value={getJoinUrl(peerId)} size={200} level="M" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Scanne pour rejoindre</p>

          <details className="text-left">
            <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-200">
              Ou entre le code manuellement
            </summary>
            <div className="mt-2 p-2 bg-white/10 rounded text-center">
              <p className="text-sm font-mono text-green-400 select-all break-all">{peerId}</p>
            </div>
          </details>
        </div>
      )}

      <div className="text-white my-6">
        <p>
          Joueurs: {connectedPeers.length + 1}/{MAX_PLAYERS}
        </p>
        <p className="text-sm text-gray-400">{CONNECTION_STATUS_LABELS[status]}</p>
      </div>

      {isHost && (
        <Button
          onClick={onStart}
          disabled={!canStart}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 mb-4"
          size="lg"
        >
          {canStart ? (
            'Lancer la partie !'
          ) : (
            <span>
              Lancer la partie
              <span className="block text-xs font-normal opacity-75">En attente de joueurs...</span>
            </span>
          )}
        </Button>
      )}

      <Button onClick={() => setShowQuitConfirm(true)} variant="destructive" size="sm">
        Quitter
      </Button>

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
