import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

export const getSocket = (): Socket => {
  if (!socket) {
    const BACKEND_URL = 'http://localhost:5000';
    
    console.log('[Socket] Initializing new connection to:', BACKEND_URL);
    
    socket = io(BACKEND_URL, {
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
    
    // Set up event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected to server with ID:', socket?.id);
      
      // Create and dispatch a custom event that the React components can listen for
      // But we'll use a flag to indicate this is just a status update, not for notifications
      const event = new CustomEvent('backend_connected', {
        detail: { socketId: socket?.id, silentUpdate: true }
      });
      window.dispatchEvent(event);
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

export const streamAudioData = async (audioBlob: Blob): Promise<void> => {
  try {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error('[Socket] Cannot stream audio: Socket not connected');
      return;
    }
    
    // Convert Blob to base64 string for transmission
    const base64Data = await blobToBase64(audioBlob);
    
    console.log('[Socket] Streaming audio data, size:', audioBlob.size);
    
    // Emit the audio data to the server
    socket.emit('stream_audio', {
      audio: base64Data,
      timestamp: Date.now(),
      format: audioBlob.type || 'audio/pcm'
    });
  } catch (error) {
    console.error('[Socket] Error streaming audio data:', error);
  }
};

export const streamVideoFrame = async (frameBlob: Blob): Promise<void> => {
  try {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error('[Socket] Cannot stream video: Socket not connected');
      return;
    }
    
    // Convert Blob to base64 string for transmission
    const base64Data = await blobToBase64(frameBlob);
    
    console.log('[Socket] Streaming video frame, size:', frameBlob.size);
    
    // Emit the video frame to the server
    socket.emit('stream_video', {
      frame: base64Data,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Socket] Error streaming video frame:', error);
  }
};

export const streamScreenFrame = async (frameBlob: Blob, prompt?: string): Promise<void> => {
  try {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error('[Socket] Cannot stream screen: Socket not connected');
      return;
    }
    
    // Convert Blob to base64 string for transmission
    const base64Data = await blobToBase64(frameBlob);
    
    console.log('[Socket] Streaming screen frame, size:', frameBlob.size);
    
    // Emit the screen frame to the server
    socket.emit('stream_screen', {
      frame: base64Data,
      timestamp: Date.now(),
      prompt: prompt || 'Analyze this screen content'
    });
  } catch (error) {
    console.error('[Socket] Error streaming screen frame:', error);
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract just the base64 data portion (remove the data URL prefix)
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

let mediaHandlerInstance: any = null;

export const getMediaHandler = async () => {
  if (!mediaHandlerInstance) {
    // We need to dynamically import the MediaHandler to avoid circular dependencies
    const { MediaHandler } = await import('./MediaHandler');
    mediaHandlerInstance = new MediaHandler();
  }
  return mediaHandlerInstance;
};
