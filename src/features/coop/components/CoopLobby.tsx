'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface CoopLobbyProps {
  playerName: string;
  joinId: string;
  onPlayerNameChange: (name: string) => void;
  onJoinIdChange: (id: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function CoopLobby({
  playerName,
  joinId,
  onPlayerNameChange,
  onJoinIdChange,
  onCreateRoom,
  onJoinRoom,
}: CoopLobbyProps) {
  return (
    <Card className="w-full max-w-md bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-2xl text-white text-center">Mode Coop</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Input
          placeholder="Ton pseudo"
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />

        <div className="space-y-3">
          <Button
            onClick={onCreateRoom}
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
            onChange={(e) => onJoinIdChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          <Button onClick={onJoinRoom} variant="outline" className="w-full" size="lg">
            Rejoindre
          </Button>
        </div>

        <Link href="/" className="block text-center text-gray-400 hover:text-white">
          ← Retour
        </Link>
      </CardContent>
    </Card>
  );
}
