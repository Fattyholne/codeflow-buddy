import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

let socket: Socket | null = null;

// Function to get the socket instance
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: false,
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

// Function to close the socket connection
export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Socket connection closed.');
  }
};

// Utility function to emit events
export const emitEvent = (event: string, data: any): void => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`[Socket] Not connected, cannot emit ${event}`);
  }
};

export const isConnected = (): boolean => {
    return socket != null && socket.connected;
}

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

// Add this at the end of the file or where appropriate:
let mediaHandlerInstance: any = null;

export const getMediaHandler = async () => {
  if (!mediaHandlerInstance) {
    const { MediaHandler } = await import('./MediaHandler');
    mediaHandlerInstance = new MediaHandler();
  }
  return mediaHandlerInstance;
};
