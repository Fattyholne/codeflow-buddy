
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ScreenShare, StopCircle, Copy } from "lucide-react";
import { initializeScreenShare, endScreenShare } from "@/lib/api";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface ScreenSharePanelProps {
  isVisible: boolean;
}

const ScreenSharePanel: React.FC<ScreenSharePanelProps> = ({ isVisible }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [sessionId, setSessionId] = useLocalStorage<string>("screen_share_session_id", "");
  const [userId, setUserId] = useLocalStorage<string>("user_id", "");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    // Generate a user ID if one doesn't exist
    if (!userId) {
      setUserId(generateId());
    }
  }, [userId, setUserId]);
  
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };
  
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      setIsSharing(true);
      
      // Create a new session or use existing one
      if (!sessionId) {
        try {
          // This would call the API in a real implementation
          // const session = await createSession();
          // setSessionId(session.id);
          setSessionId(generateId()); // Temporary for demo
          
          // Initialize WebRTC connection
          await initializeScreenShare(sessionId, userId, stream);
        } catch (error) {
          console.error("Error creating screen share session:", error);
        }
      } else {
        // Initialize WebRTC with existing session
        await initializeScreenShare(sessionId, userId, stream);
      }
      
      toast({
        title: "Screen Sharing Started",
        description: "Your screen is now being shared."
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast({
        title: "Screen Sharing Failed",
        description: "Could not access your screen. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  const stopScreenShare = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsSharing(false);
    
    // End the WebRTC connection if we have a session
    if (sessionId && userId) {
      try {
        await endScreenShare(sessionId, userId);
      } catch (error) {
        console.error("Error ending screen share:", error);
      }
    }
    
    toast({
      title: "Screen Sharing Stopped",
      description: "Your screen is no longer being shared."
    });
  };
  
  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      toast({
        title: "Session ID Copied",
        description: "Share this ID with others to let them view your screen."
      });
    }
  };
  
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Screen Sharing</h3>
      
      <Card className="p-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your screen to collaborate or get help with your code or applications.
          </p>
          
          {isSharing ? (
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={stopScreenShare}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Sharing
            </Button>
          ) : (
            <Button 
              variant="default" 
              className="w-full"
              onClick={startScreenShare}
            >
              <ScreenShare className="mr-2 h-4 w-4" />
              Start Screen Share
            </Button>
          )}
          
          {isSharing && (
            <div className="space-y-2">
              <div className="relative rounded-md overflow-hidden border aspect-video bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              
              {sessionId && (
                <div className="flex items-center justify-between mt-2 p-2 bg-muted rounded-md">
                  <span className="text-xs truncate mr-2">ID: {sessionId}</span>
                  <Button variant="ghost" size="sm" onClick={copySessionId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                This is a local preview of your shared screen. Using the API would enable others 
                to view your screen through WebRTC.
              </p>
            </div>
          )}
          
          {!isSharing && (
            <p className="text-xs text-muted-foreground">
              Share your terminal, code editor, or any application to get help or collaborate.
              No additional setup is required for local screen preview.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ScreenSharePanel;
