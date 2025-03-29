
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ScreenShare, StopCircle, Copy } from "lucide-react";

interface ScreenSharePanelProps {
  isVisible: boolean;
}

const ScreenSharePanel: React.FC<ScreenSharePanelProps> = ({ isVisible }) => {
  const [isSharing, setIsSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
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
  
  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsSharing(false);
    
    toast({
      title: "Screen Sharing Stopped",
      description: "Your screen is no longer being shared."
    });
  };
  
  // Clean up on unmount
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
              <p className="text-xs text-muted-foreground">
                This is a local preview of your shared screen. In a complete implementation, 
                this would be visible to your collaborators through WebRTC.
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
