
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const BACKEND_URL = 'http://localhost:5000';
    
    console.log('[Socket] Initializing new connection to:', BACKEND_URL);
    
    socket = io(BACKEND_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });
    
    // Set up event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected successfully:', {
        timestamp: new Date().toISOString(),
        id: socket?.id,
        connected: socket?.connected
      });
    });
    
    socket.on('connection_status', (info) => {
      console.log('[Socket] Server info:', info);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', {
        timestamp: new Date().toISOString(),
        reason,
        wasConnected: socket?.connected
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', {
        timestamp: new Date().toISOString(),
        error: error.message
      });
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', {
        timestamp: new Date().toISOString(),
        attemptNumber
      });
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after attempts:', {
        timestamp: new Date().toISOString(),
        attemptNumber
      });
    });
    
    socket.on('reconnect_failed', () => {
      console.error('[Socket] Failed to reconnect after all attempts', {
        timestamp: new Date().toISOString()
      });
    });
    
    socket.on('error', (error) => {
      console.error('[Socket] Socket error:', {
        timestamp: new Date().toISOString(),
        error
      });
    });
    
    // Debug: log all events
    const originalEmit = socket.emit;
    socket.emit = function(event, ...args) {
      console.log('[Socket] Event:', {
        timestamp: new Date().toISOString(),
        event,
        args
      });
      return originalEmit.apply(this, [event, ...args]);
    };
    
    // Initial connection attempt
    console.log('[Socket] Initial connection attempt...');
  }
  
  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Connection closed');
  }
};

export const emitEvent = (event: string, data: any): void => {
  const socket = getSocket();
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`[Socket] Can't emit '${event}': Socket not connected`);
  }
};
