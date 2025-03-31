
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
      console.log('[Socket] Connection status:', info);
      
      if (info.status === 'connected') {
        const event = new CustomEvent('backend_connected', {
          detail: { socketId: info.sid, silentUpdate: true }
        });
        window.dispatchEvent(event);
      }
    });
    
    socket.on('server_ready', (info) => {
      console.log('[Socket] Server ready at:', info.time);
      
      // Additionally trigger connected event here to ensure components capture it
      const event = new CustomEvent('backend_connected', {
        detail: { socketId: socket?.id, timestamp: info.time, silentUpdate: true }
      });
      window.dispatchEvent(event);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from server. Reason:', reason);
      
      const event = new CustomEvent('backend_disconnected', {
        detail: { reason }
      });
      window.dispatchEvent(event);
    });
    
    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      connectionAttempts++;
      
      if (connectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        const event = new CustomEvent('backend_connection_failed', {
          detail: { error: error.message }
        });
        window.dispatchEvent(event);
      }
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      connectionAttempts = 0;
      
      // Reset connection attempts and notify components
      const event = new CustomEvent('backend_connected', {
        detail: { socketId: socket?.id, reconnected: true, silentUpdate: true }
      });
      window.dispatchEvent(event);
    });
    
    socket.on('reconnect_failed', () => {
      console.log('[Socket] Failed to reconnect after', MAX_RECONNECTION_ATTEMPTS, 'attempts');
      
      const event = new CustomEvent('backend_connection_failed', {
        detail: { maxAttempts: MAX_RECONNECTION_ATTEMPTS }
      });
      window.dispatchEvent(event);
    });
    
    socket.on('error', (error) => {
      console.error('[Socket] Socket error:', error);
    });
    
    // Add to your socketClient.ts
    socket.on('audio_response', (data) => {
        console.log('Received audio response:', data);
    });

    socket.on('video_response', (data) => {
        console.log('Received video response:', data);
    });

    socket.on('error', (error) => {
        console.error('Server error:', error);
    });

    // Modify the ping interval to not trigger notifications
    setInterval(() => {
      if (socket && socket.connected) {
        console.log('[Socket] Sending ping to verify connection');
        socket.emit('ping_server', { timestamp: Date.now() }, (response: any) => {
          if (response && response.status === 'pong') {
            console.log('[Socket] Received pong, connection confirmed active');
            // Update status without notification
            const event = new CustomEvent('backend_connected', {
              detail: { socketId: socket?.id, pingPong: true, silentUpdate: true }
            });
            window.dispatchEvent(event);
          }
        });
      }
    }, 10000); // Check every 10 seconds
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
    const socket = getSocket();
    
    if (socket && socket.connected) {
      socket.emit(event, data, (response: any) => {
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

// Stream audio data through socket connection
export const streamAudioData = (audioBlob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    // Convert audio blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      if (!reader.result) {
        reject(new Error('Failed to read audio data'));
        return;
      }
      const base64Audio = reader.result.toString().split(',')[1]; // Remove data URL header
      
      if (!base64Audio) {
        reject(new Error('Failed to convert audio to base64'));
        return;
      }
      
      // Send audio data to server
      console.log('[Socket] Emitting stream_audio event'); // Added console log
      socket.emit('stream_audio', {
        audio: base64Audio,
        timestamp: Date.now(),
        format: 'audio/pcm' // Adjust based on your audio format
      }, (response: any) => {
        if (response && response.status === 'success') {
          console.log('[Socket] stream_audio event successful'); // Added console log
          resolve();
        } else {
          console.error('[Socket] stream_audio event failed', response); // Added console log
          reject(response || new Error('Failed to stream audio'));
        }
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read audio data'));
    };
  });
};

// Stream video data through socket connection
export const streamVideoFrame = (videoFrame: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    // Convert video frame to base64
    const reader = new FileReader();
    reader.readAsDataURL(videoFrame);
    reader.onloadend = () => {
      if (!reader.result) {
        reject(new Error('Failed to read video data'));
        return;
      }
      const base64Frame = reader.result.toString().split(',')[1]; // Remove data URL header
      
      if (!base64Frame) {
        reject(new Error('Failed to convert video frame to base64'));
        return;
      }
      
      // Send video data to server
      console.log('[Socket] Emitting stream_video event'); // Added console log
      socket.emit('stream_video', {
        frame: base64Frame,
        timestamp: Date.now()
      }, (response: any) => {
        if (response && response.status === 'success') {
          console.log('[Socket] stream_video event successful'); // Added console log
          resolve();
        } else {
          console.error('[Socket] stream_video event failed', response); // Added console log
          reject(response || new Error('Failed to stream video frame'));
        }
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read video data'));
    };
  });
};

// Stream screen data through socket connection
export const streamScreenFrame = (screenFrame: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    // Convert screen frame to base64
    const reader = new FileReader();
    reader.readAsDataURL(screenFrame);
    reader.onloadend = () => {
      if (!reader.result) {
        reject(new Error('Failed to read screen data'));
        return;
      }
      const base64Frame = reader.result.toString().split(',')[1]; // Remove data URL header
      
      if (!base64Frame) {
        reject(new Error('Failed to convert screen frame to base64'));
        return;
      }
      
      // Send screen data to server
      console.log('[Socket] Emitting stream_screen event'); // Added console log
      socket.emit('stream_screen', {
        frame: base64Frame,
        timestamp: Date.now(),
        prompt: localStorage.getItem('screen_prompt') || ''
      }, (response: any) => {
        if (response && response.status === 'success') {
          console.log('[Socket] stream_screen event successful'); // Added console log
          resolve();
        } else {
          console.error('[Socket] stream_screen event failed', response); // Added console log
          reject(response || new Error('Failed to stream screen frame'));
        }
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read screen data'));
    };
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
