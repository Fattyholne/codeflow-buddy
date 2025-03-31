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
      transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
    });
    
    socket.on('connect', () => {
      console.log('[Socket] Connected to backend');
      window.dispatchEvent(new Event('backend_connected'));
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from backend');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    socket.connect();
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

export const emitEvent = (event: string, data: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const currentSocket = getSocket();
    
    if (currentSocket && currentSocket.connected) {
      currentSocket.emit(event, data, (response: any) => {
        if (response && response.status === 'success') {
          resolve(true);
        } else {
          reject(response);
        }
      });
    } else {
      reject(new Error('Socket not connected'));
    }
  });
};

// Modified to also check for active response from server
export const isConnected = (): boolean => {
  return !!(socket && socket.connected);
};

// Wait for backend connection with improved timeout handling
export const waitForConnection = (timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (socket && socket.connected) {
      resolve(true);
      return;
    }
    
    const currentSocket = getSocket(); // Initialize if not already
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      window.removeEventListener('backend_connected', handleConnect);
      resolve(false);
    }, timeout);
    
    // Listen for connection
    const handleConnect = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('backend_connected', handleConnect);
      resolve(true);
    };
    
    window.addEventListener('backend_connected', handleConnect);
  });
};

// Function to stream audio data
export const streamAudioData = async (audioBlob: Blob): Promise<void> => {
    await waitForConnection();
    emitEvent('audio_data', audioBlob);
};

// Function to stream video frame
export const streamVideoFrame = async (imageBlob: Blob): Promise<void> => {
    await waitForConnection();
    emitEvent('video_frame', imageBlob);
};

// Function to stream screen frame
export const streamScreenFrame = async (imageBlob: Blob): Promise<void> => {
    await waitForConnection();
    emitEvent('screen_frame', imageBlob);
};

// Add this at the end of the file:
let mediaHandlerInstance: any = null;

export const getMediaHandler = async () => {
  if (!mediaHandlerInstance) {
    const { MediaHandler } = await import('./MediaHandler');
    mediaHandlerInstance = new MediaHandler();
  }
  return mediaHandlerInstance;
};
