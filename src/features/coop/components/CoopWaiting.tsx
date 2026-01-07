'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ConnectionStatus } from '@/types/game';

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

  const getJoinUrl = (id: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/coop?join=${id}`;
  };

  return (
    <Card className="w-full max-w-md bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-xl text-white text-center">
          {isHost ? 'Partage ce code' : 'En attente...'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        {isHost && peerId && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl">
                <QRCodeSVG value={getJoinUrl(peerId)} size={160} level="M" />
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

        <div className="text-white">
          <p>Joueurs connectés: {connectedPeers.length + 1}</p>
          <p className="text-sm text-gray-400">Status: {status}</p>
        </div>

        {isHost && connectedPeers.length > 0 && (
          <Button onClick={onStart} className="w-full bg-green-500 hover:bg-green-600" size="lg">
            Lancer la partie!
          </Button>
        )}

        <Button onClick={() => setShowQuitConfirm(true)} variant="destructive" size="sm">
          Quitter
        </Button>
      </CardContent>

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
    </Card>
  );
}
