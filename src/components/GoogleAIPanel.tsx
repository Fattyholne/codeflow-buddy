
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/components/ui/link";
import { Info } from "lucide-react";

interface GoogleAIPanelProps {
  isVisible: boolean;
}

const GoogleAIPanel: React.FC<GoogleAIPanelProps> = ({ isVisible }) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("google_ai_api_key") || "";
  });

  const handleSaveApiKey = () => {
    localStorage.setItem("google_ai_api_key", apiKey);
    toast({
      title: "API Key Saved",
      description: "Your Google AI API key has been saved locally.",
    });
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Google AI Integration</h3>
      
      <Card className="p-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your Google AI API key to enable Gemini models and voice/video interactions.
          </p>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
            >
              Save API Key
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Context chunking (in Settings tab) helps maintain performance with large conversations by only sending relevant parts to the API.
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              This key will be stored in your browser's local storage. For better security,
              consider connecting to Supabase and storing your key there.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GoogleAIPanel;
