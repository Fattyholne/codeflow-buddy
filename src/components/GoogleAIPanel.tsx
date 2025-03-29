
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/components/ui/link";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      
      <Tabs defaultValue="api-key" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api-key">API Key</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-key">
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
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quick links to Google's AI development resources and tools.
              </p>
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">Google Cloud & Vertex AI</h4>
                <div className="grid gap-2">
                  <Link href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Google Cloud Console
                  </Link>
                  <Link href="https://console.cloud.google.com/vertex-ai" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Console
                  </Link>
                  <Link href="https://console.cloud.google.com/vertex-ai/model-garden" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Model Garden
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">Notebooks & Colab</h4>
                <div className="grid gap-2">
                  <Link href="https://colab.research.google.com/" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Google Colab
                  </Link>
                  <Link href="https://console.cloud.google.com/vertex-ai/colab/notebooks" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Notebooks
                  </Link>
                  <Link href="https://colab.research.google.com/github/googlecolab/colabtools/blob/main/notebooks/colab-github-demo.ipynb" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Colab GitHub Integration
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-xs font-medium uppercase text-muted-foreground">Development Resources</h4>
                <div className="grid gap-2">
                  <Link href="https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/api-quickstart" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI API Quickstart
                  </Link>
                  <Link href="https://ai.google.dev/tutorials/quickstart" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Gemini API Guide
                  </Link>
                  <Link href="https://github.com/GoogleCloudPlatform/vertex-ai-samples" target="_blank" rel="noopener noreferrer" className="text-sm">
                    Vertex AI Code Samples
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoogleAIPanel;
