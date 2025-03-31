
import { useState, useEffect } from 'react';
import { getMediaHandler } from '../lib/socketClient';
import { useToast } from './use-toast';

export function useMediaCapture() {
  const [isCapturingAudio, setIsCapturingAudio] = useState(false);
  const [isCapturingVideo, setIsCapturingVideo] = useState(false);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [mediaHandler, setMediaHandler] = useState<any>(null);
  const { toast } = useToast();

  // Initialize the media handler
  useEffect(() => {
    const initMediaHandler = async () => {
      try {
        const handler = await getMediaHandler();
        setMediaHandler(handler);
      } catch (error) {
        console.error('[MediaCapture] Failed to initialize media handler:', error);
      }
    };

    initMediaHandler();

    // Cleanup function
    return () => {
      if (mediaHandler) {
        mediaHandler.stopAll();
      }
    };
  }, []);

  const startAudioCapture = async () => {
    try {
      if (!mediaHandler) {
        const handler = await getMediaHandler();
        setMediaHandler(handler);
      }
      
      await mediaHandler.startAudioCapture();
      setIsCapturingAudio(true);
      toast({
        title: "Microphone Active",
        description: "Speak to interact with the AI. Your audio is being streamed.",
      });
    } catch (error) {
      console.error('[MediaCapture] Failed to start audio capture:', error);
      toast({
        title: "Microphone Error",
        description: "Failed to access your microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopAudioCapture = () => {
    if (mediaHandler) {
      mediaHandler.stopAudioCapture();
      setIsCapturingAudio(false);
      toast({
        title: "Microphone Disabled",
        description: "Audio streaming has been stopped.",
      });
    }
  };

  const startVideoCapture = async () => {
    try {
      if (!mediaHandler) {
        const handler = await getMediaHandler();
        setMediaHandler(handler);
      }
      
      await mediaHandler.startVideoCapture();
      setIsCapturingVideo(true);
      toast({
        title: "Camera Active",
        description: "Your camera is now streaming to the AI. Show objects or documents.",
      });
    } catch (error) {
      console.error('[MediaCapture] Failed to start video capture:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopVideoCapture = () => {
    if (mediaHandler) {
      mediaHandler.stopVideoCapture();
      setIsCapturingVideo(false);
      toast({
        title: "Camera Disabled",
        description: "Video streaming has been stopped.",
      });
    }
  };

  const startScreenCapture = async () => {
    try {
      if (!mediaHandler) {
        const handler = await getMediaHandler();
        setMediaHandler(handler);
      }
      
      await mediaHandler.startScreenCapture();
      setIsCapturingScreen(true);
      toast({
        title: "Screen Sharing Active",
        description: "Your screen is now being shared with the AI.",
      });
    } catch (error) {
      console.error('[MediaCapture] Failed to start screen capture:', error);
      toast({
        title: "Screen Sharing Error",
        description: "Failed to share your screen. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopScreenCapture = () => {
    if (mediaHandler) {
      mediaHandler.stopScreenCapture();
      setIsCapturingScreen(false);
      toast({
        title: "Screen Sharing Disabled",
        description: "Screen sharing has been stopped.",
      });
    }
  };

  const toggleAudioCapture = async () => {
    if (isCapturingAudio) {
      stopAudioCapture();
    } else {
      await startAudioCapture();
    }
  };

  const toggleVideoCapture = async () => {
    if (isCapturingVideo) {
      stopVideoCapture();
    } else {
      await startVideoCapture();
    }
  };

  const toggleScreenCapture = async () => {
    if (isCapturingScreen) {
      stopScreenCapture();
    } else {
      await startScreenCapture();
    }
  };

  return {
    isCapturingAudio,
    isCapturingVideo,
    isCapturingScreen,
    startAudioCapture,
    stopAudioCapture,
    startVideoCapture,
    stopVideoCapture,
    startScreenCapture,
    stopScreenCapture,
    toggleAudioCapture,
    toggleVideoCapture,
    toggleScreenCapture,
  };
}
