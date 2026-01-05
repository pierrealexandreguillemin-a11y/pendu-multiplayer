/**
 * Signaling Server for Pendu Multiplayer
 * Deployed on Deno Deploy (free tier, no credit card required)
 *
 * Handles:
 * - Room creation/joining
 * - WebRTC signaling (SDP exchange)
 * - Player connection management
 */

// Types
interface Player {
  id: string;
  name: string;
  socket: WebSocket;
  isHost: boolean;
}

interface Room {
  code: string;
  mode: 'coop' | 'pvp';
  players: Map<string, Player>;
  hostId: string;
  createdAt: number;
}

// In-memory storage
const rooms = new Map<string, Room>();

// Utility functions
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure uniqueness
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function generatePlayerId(): string {
  return crypto.randomUUID();
}

function broadcastToRoom(room: Room, message: object, excludeId?: string): void {
  const data = JSON.stringify(message);
  room.players.forEach((player) => {
    if (player.id !== excludeId && player.socket.readyState === WebSocket.OPEN) {
      player.socket.send(data);
    }
  });
}

function cleanupStaleRooms(): void {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours

  rooms.forEach((room, code) => {
    if (now - room.createdAt > maxAge || room.players.size === 0) {
      rooms.delete(code);
    }
  });
}

// Message handlers
interface CreateRoomMessage {
  type: 'create-room';
  playerName: string;
  mode: 'coop' | 'pvp';
}

interface JoinRoomMessage {
  type: 'join-room';
  roomCode: string;
  playerName: string;
}

interface SignalMessage {
  type: 'signal';
  targetId: string;
  signal: unknown;
}

interface GameMessage {
  type: 'game-message';
  data: unknown;
}

interface LeaveRoomMessage {
  type: 'leave-room';
}

type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | SignalMessage
  | GameMessage
  | LeaveRoomMessage;

function handleMessage(
  socket: WebSocket,
  playerId: string,
  roomCode: string | null,
  message: ClientMessage
): string | null {
  switch (message.type) {
    case 'create-room': {
      const code = generateRoomCode();
      const room: Room = {
        code,
        mode: message.mode,
        players: new Map(),
        hostId: playerId,
        createdAt: Date.now(),
      };

      const player: Player = {
        id: playerId,
        name: message.playerName,
        socket,
        isHost: true,
      };

      room.players.set(playerId, player);
      rooms.set(code, room);

      socket.send(
        JSON.stringify({
          type: 'room-created',
          roomCode: code,
          playerId,
        })
      );

      return code;
    }

    case 'join-room': {
      const room = rooms.get(message.roomCode.toUpperCase());

      if (!room) {
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Room not found',
          })
        );
        return null;
      }

      if (room.players.size >= 6) {
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Room is full',
          })
        );
        return null;
      }

      const player: Player = {
        id: playerId,
        name: message.playerName,
        socket,
        isHost: false,
      };

      room.players.set(playerId, player);

      // Send room info to joiner
      const playerList = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      }));

      socket.send(
        JSON.stringify({
          type: 'room-joined',
          roomCode: room.code,
          playerId,
          players: playerList,
          hostId: room.hostId,
          mode: room.mode,
        })
      );

      // Notify others
      broadcastToRoom(
        room,
        {
          type: 'player-joined',
          player: {
            id: playerId,
            name: message.playerName,
            isHost: false,
          },
        },
        playerId
      );

      return room.code;
    }

    case 'signal': {
      if (!roomCode) return roomCode;

      const room = rooms.get(roomCode);
      if (!room) return null;

      const targetPlayer = room.players.get(message.targetId);
      if (targetPlayer && targetPlayer.socket.readyState === WebSocket.OPEN) {
        targetPlayer.socket.send(
          JSON.stringify({
            type: 'signal',
            fromId: playerId,
            signal: message.signal,
          })
        );
      }
      return roomCode;
    }

    case 'game-message': {
      if (!roomCode) return roomCode;

      const room = rooms.get(roomCode);
      if (!room) return null;

      broadcastToRoom(
        room,
        {
          type: 'game-message',
          fromId: playerId,
          data: message.data,
        },
        playerId
      );
      return roomCode;
    }

    case 'leave-room': {
      if (!roomCode) return null;
      handleDisconnect(playerId, roomCode);
      return null;
    }

    default:
      return roomCode;
  }
}

function handleDisconnect(playerId: string, roomCode: string | null): void {
  if (!roomCode) return;

  const room = rooms.get(roomCode);
  if (!room) return;

  const player = room.players.get(playerId);
  if (!player) return;

  room.players.delete(playerId);

  // If host left, assign new host or close room
  if (player.isHost && room.players.size > 0) {
    const newHost = room.players.values().next().value;
    if (newHost) {
      newHost.isHost = true;
      room.hostId = newHost.id;

      broadcastToRoom(room, {
        type: 'host-changed',
        newHostId: newHost.id,
      });
    }
  }

  // Notify others
  broadcastToRoom(room, {
    type: 'player-left',
    playerId,
    playerName: player.name,
  });

  // Clean up empty rooms
  if (room.players.size === 0) {
    rooms.delete(roomCode);
  }
}

// Main server
Deno.serve({ port: 8000 }, (req: Request) => {
  const url = new URL(req.url);

  // Health check
  if (url.pathname === '/health') {
    return new Response('OK', { status: 200 });
  }

  // Stats endpoint
  if (url.pathname === '/stats') {
    cleanupStaleRooms();
    return new Response(
      JSON.stringify({
        rooms: rooms.size,
        players: Array.from(rooms.values()).reduce((acc, r) => acc + r.players.size, 0),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // WebSocket upgrade
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);

    const playerId = generatePlayerId();
    let roomCode: string | null = null;

    socket.onopen = () => {
      console.log(`[${playerId}] Connected`);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as ClientMessage;
        roomCode = handleMessage(socket, playerId, roomCode, message);
      } catch (error) {
        console.error(`[${playerId}] Error:`, error);
        socket.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          })
        );
      }
    };

    socket.onclose = () => {
      console.log(`[${playerId}] Disconnected`);
      handleDisconnect(playerId, roomCode);
    };

    socket.onerror = (error) => {
      console.error(`[${playerId}] Socket error:`, error);
    };

    return response;
  }

  // Default response
  return new Response(
    JSON.stringify({
      name: 'Pendu Signaling Server',
      version: '1.0.0',
      endpoints: {
        websocket: 'wss://[host]/',
        health: '/health',
        stats: '/stats',
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
});

console.log('Pendu Signaling Server running on http://localhost:8000');
