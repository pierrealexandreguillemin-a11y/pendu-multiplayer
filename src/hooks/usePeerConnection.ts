'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { GameMessage, ConnectionStatus } from '@/types/game';
import { safeValidateGameMessage } from '@/lib/message-validation';

type MessageHandler = (message: GameMessage, fromId: string) => void;
type DisconnectHandler = (peerId: string) => void;

interface UsePeerConnectionReturn {
  peerId: string | null;
  status: ConnectionStatus;
  error: string | null;
  isHost: boolean;
  connectedPeers: string[];
  createRoom: () => Promise<string>;
  joinRoom: (hostId: string) => Promise<string>;
  sendMessage: (message: GameMessage) => void;
  disconnect: () => void;
  onMessage: (handler: MessageHandler) => void;
  offMessage: () => void;
  onPeerDisconnect: (handler: DisconnectHandler) => void;
  offPeerDisconnect: () => void;
}

const MAX_BUFFERED_MESSAGES = 50;
const JOIN_TIMEOUT_MS = 10000;
const CREATE_TIMEOUT_MS = 10000;
const MAX_RECONNECT_ATTEMPTS = 3;

interface PeerRefs {
  peerRef: React.MutableRefObject<Peer | null>;
  connectionsRef: React.MutableRefObject<Map<string, DataConnection>>;
  messageHandlerRef: React.MutableRefObject<MessageHandler | null>;
  messageBufferRef: React.MutableRefObject<Array<{ message: GameMessage; fromId: string }>>;
  disconnectHandlerRef: React.MutableRefObject<DisconnectHandler | null>;
  hostIdRef: React.MutableRefObject<string | null>;
  reconnectAttemptsRef: React.MutableRefObject<number>;
  reconnectTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

interface PeerSetters {
  setPeerId: (id: string | null) => void;
  setStatus: (s: ConnectionStatus) => void;
  setError: (e: string | null) => void;
  setConnectedPeers: (peers: string[]) => void;
  setReconnectTrigger: React.Dispatch<React.SetStateAction<number>>;
}

function makeSetupConnection(refs: PeerRefs, setters: PeerSetters) {
  return function setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      refs.connectionsRef.current.set(conn.peer, conn);
      setters.setConnectedPeers(Array.from(refs.connectionsRef.current.keys()));
      setters.setStatus('connected');
    });
    conn.on('data', (data) => {
      const msg = safeValidateGameMessage(data);
      if (!msg) {
        console.warn('[PeerConnection] Invalid message received:', data);
        return;
      }
      if (refs.messageHandlerRef.current) {
        refs.messageHandlerRef.current(msg, conn.peer);
      } else if (refs.messageBufferRef.current.length < MAX_BUFFERED_MESSAGES) {
        refs.messageBufferRef.current.push({ message: msg, fromId: conn.peer });
      } else {
        console.warn('[PeerConnection] Message buffer full, dropping message');
      }
    });
    conn.on('close', () => {
      const id = conn.peer;
      refs.connectionsRef.current.delete(id);
      setters.setConnectedPeers(Array.from(refs.connectionsRef.current.keys()));
      if (refs.disconnectHandlerRef.current) refs.disconnectHandlerRef.current(id);
      if (refs.connectionsRef.current.size === 0) {
        if (refs.hostIdRef.current !== null) {
          setters.setStatus('reconnecting');
          setters.setReconnectTrigger((n) => n + 1);
        } else setters.setStatus('disconnected');
      }
    });
    conn.on('error', (err) => {
      console.error('[PeerConnection] Connection error:', err.message);
      setters.setError(err.message);
    });
  };
}

interface ReconnectOptions {
  reconnectTrigger: number;
  refs: PeerRefs;
  setters: PeerSetters;
  setupConnection: (conn: DataConnection) => void;
}

/** ISO/IEC 25010 - Reliability: Reconnect guest to host with exponential backoff. */
function useReconnectEffect({
  reconnectTrigger,
  refs,
  setters,
  setupConnection,
}: ReconnectOptions) {
  useEffect(() => {
    if (reconnectTrigger === 0 || refs.hostIdRef.current === null) return;
    const attempt = refs.reconnectAttemptsRef.current + 1;
    refs.reconnectAttemptsRef.current = attempt;
    const delayMs = Math.pow(2, attempt - 1) * 1000;
    console.info(
      `[PeerConnection] Reconnect attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS} in ${delayMs}ms`
    );
    const timerId = setTimeout(() => {
      if (attempt > MAX_RECONNECT_ATTEMPTS) {
        console.warn('[PeerConnection] Max reconnect attempts reached, giving up');
        refs.reconnectAttemptsRef.current = 0;
        refs.hostIdRef.current = null;
        setters.setStatus('disconnected');
        return;
      }
      const targetHostId = refs.hostIdRef.current;
      if (targetHostId === null) return;
      refs.peerRef.current?.destroy();
      const peer = new Peer();
      refs.peerRef.current = peer;
      peer.on('open', (id) => {
        setters.setPeerId(id);
        const conn = peer.connect(targetHostId, { reliable: true });
        setupConnection(conn);
        conn.on('open', () => {
          console.info('[PeerConnection] Reconnected successfully');
          refs.reconnectAttemptsRef.current = 0;
        });
        conn.on('error', () => {
          setters.setReconnectTrigger((n) => n + 1);
        });
      });
      peer.on('error', () => {
        setters.setReconnectTrigger((n) => n + 1);
      });
    }, delayMs);
    refs.reconnectTimerRef.current = timerId;
    return () => {
      clearTimeout(timerId);
      refs.reconnectTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnectTrigger]);
}

function makeCreateRoom(
  refs: PeerRefs,
  setters: PeerSetters,
  setIsHost: (v: boolean) => void,
  setupConnection: (conn: DataConnection) => void
) {
  return (): Promise<string> =>
    new Promise((resolve, reject) => {
      setters.setStatus('connecting');
      setIsHost(true);
      const timeoutId = setTimeout(() => {
        refs.peerRef.current?.destroy();
        setters.setError('Room creation timeout - PeerJS server may be unreachable');
        setters.setStatus('error');
        reject(new Error('Room creation timeout'));
      }, CREATE_TIMEOUT_MS);
      const peer = new Peer();
      refs.peerRef.current = peer;
      peer.on('open', (id) => {
        clearTimeout(timeoutId);
        setters.setPeerId(id);
        setters.setStatus('connected');
        resolve(id);
      });
      peer.on('connection', (conn) => {
        setupConnection(conn);
      });
      peer.on('error', (err) => {
        clearTimeout(timeoutId);
        setters.setError(err.message);
        setters.setStatus('error');
        reject(err);
      });
    });
}

function makeJoinRoom(
  refs: PeerRefs,
  setters: PeerSetters,
  setIsHost: (v: boolean) => void,
  setupConnection: (conn: DataConnection) => void
) {
  return (hostId: string): Promise<string> =>
    new Promise((resolve, reject) => {
      setters.setStatus('connecting');
      setIsHost(false);
      refs.hostIdRef.current = hostId;
      refs.reconnectAttemptsRef.current = 0;
      const timeoutId = setTimeout(() => {
        refs.peerRef.current?.destroy();
        setters.setError('Connection timeout - host may not exist');
        setters.setStatus('error');
        reject(new Error('Connection timeout'));
      }, JOIN_TIMEOUT_MS);
      const peer = new Peer();
      refs.peerRef.current = peer;
      peer.on('open', (id) => {
        setters.setPeerId(id);
        const conn = peer.connect(hostId, { reliable: true });
        setupConnection(conn);
        conn.on('open', () => {
          clearTimeout(timeoutId);
          resolve(id);
        });
        conn.on('error', (err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
      });
      peer.on('error', (err) => {
        clearTimeout(timeoutId);
        setters.setError(err.message);
        setters.setStatus('error');
        reject(err);
      });
    });
}

function makeDisconnect(refs: PeerRefs, setters: PeerSetters, setIsHost: (v: boolean) => void) {
  return () => {
    if (refs.reconnectTimerRef.current !== null) {
      clearTimeout(refs.reconnectTimerRef.current);
      refs.reconnectTimerRef.current = null;
    }
    refs.reconnectAttemptsRef.current = 0;
    refs.hostIdRef.current = null;
    refs.connectionsRef.current.forEach((conn) => conn.close());
    refs.connectionsRef.current.clear();
    refs.peerRef.current?.destroy();
    refs.peerRef.current = null;
    setters.setPeerId(null);
    setters.setStatus('disconnected');
    setters.setConnectedPeers([]);
    setIsHost(false);
    setters.setError(null);
    refs.messageBufferRef.current = [];
    refs.messageHandlerRef.current = null;
  };
}

function makeOnMessage(refs: PeerRefs) {
  return (handler: MessageHandler) => {
    refs.messageHandlerRef.current = handler;
    if (refs.messageBufferRef.current.length > 0) {
      const buffered = [...refs.messageBufferRef.current];
      refs.messageBufferRef.current = [];
      buffered.forEach(({ message, fromId }) => {
        handler(message, fromId);
      });
    }
  };
}

/**
 * ISO/IEC 25010 - Reliability: Improved peer connection hook with message buffering
 * Messages received before handler registration are buffered and processed when handler is set
 */
export function usePeerConnection(): UsePeerConnectionReturn {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  const messageBufferRef = useRef<Array<{ message: GameMessage; fromId: string }>>([]);
  const disconnectHandlerRef = useRef<DisconnectHandler | null>(null);
  const hostIdRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refs: PeerRefs = {
    peerRef,
    connectionsRef,
    messageHandlerRef,
    messageBufferRef,
    disconnectHandlerRef,
    hostIdRef,
    reconnectAttemptsRef,
    reconnectTimerRef,
  };
  const setters: PeerSetters = {
    setPeerId,
    setStatus,
    setError,
    setConnectedPeers,
    setReconnectTrigger,
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setupConnection = useCallback(makeSetupConnection(refs, setters), []);
  useReconnectEffect({ reconnectTrigger, refs, setters, setupConnection });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const createRoom = useCallback(makeCreateRoom(refs, setters, setIsHost, setupConnection), [
    setupConnection,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const joinRoom = useCallback(makeJoinRoom(refs, setters, setIsHost, setupConnection), [
    setupConnection,
  ]);

  const sendMessage = useCallback((message: GameMessage) => {
    Array.from(connectionsRef.current.values()).forEach((conn) => {
      if (conn.open) conn.send(message);
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const disconnect = useCallback(makeDisconnect(refs, setters, setIsHost), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMessage = useCallback(makeOnMessage(refs), []);
  const offMessage = useCallback(() => {
    messageHandlerRef.current = null;
    messageBufferRef.current = [];
  }, []);
  const onPeerDisconnect = useCallback((h: DisconnectHandler) => {
    disconnectHandlerRef.current = h;
  }, []);
  const offPeerDisconnect = useCallback(() => {
    disconnectHandlerRef.current = null;
  }, []);

  useEffect(() => {
    const peer = peerRef;
    return () => {
      peer.current?.destroy();
    };
  }, []);

  return {
    peerId,
    status,
    error,
    isHost,
    connectedPeers,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect,
    onMessage,
    offMessage,
    onPeerDisconnect,
    offPeerDisconnect,
  };
}
