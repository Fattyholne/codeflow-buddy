
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Sun, Moon, Zap } from "lucide-react";

type ThemeOption = {
  id: string;
  name: string;
  type: "light" | "dark" | "neon";
  icon?: React.ReactNode;
};

const themeOptions: ThemeOption[] = [
  { id: "light", name: "Light", type: "light", icon: <Sun className="h-4 w-4" /> },
  { id: "soft-light", name: "Soft Light", type: "light", icon: <Sun className="h-4 w-4" /> },
  { id: "dark", name: "Dark", type: "dark", icon: <Moon className="h-4 w-4" /> },
  { id: "midnight", name: "Midnight", type: "dark", icon: <Moon className="h-4 w-4" /> },
  { id: "neon-blue", name: "Neon Blue", type: "neon", icon: <Zap className="h-4 w-4" /> },
  { id: "neon-purple", name: "Neon Purple", type: "neon", icon: <Zap className="h-4 w-4" /> },
  { id: "high-contrast", name: "High Contrast", type: "neon", icon: <Zap className="h-4 w-4" /> },
];

const Settings = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useLocalStorage("gemini_api_key", "");
  const [openAiKey, setOpenAiKey] = useLocalStorage("openai_api_key", "");
  const [anthropicKey, setAnthropicKey] = useLocalStorage("anthropic_api_key", "");
  const [perplexityKey, setPerplexityKey] = useLocalStorage("perplexity_api_key", "");
  const [groqKey, setGroqKey] = useLocalStorage("groq_api_key", "");
  const [tokenLimit, setTokenLimit] = useState("32000");
  const [model, setModel] = useState("gemini-pro");
  const [useVision, setUseVision] = useState(true);
  const [autoTitle, setAutoTitle] = useState(true);
  const [selectedTheme, setSelectedTheme] = useLocalStorage("selected_theme", "light");
  
  const handleSaveApiSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your API settings have been updated."
    });
  };
  
  const handleSavePreferences = () => {
    toast({
      title: "Preferences saved",
      description: "Your preferences have been updated."
    });
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Apply theme class to body
    const themeOption = themeOptions.find(theme => theme.id === themeId);
    if (themeOption) {
      if (themeOption.type === "dark") {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Apply special classes for neon themes
      if (themeOption.type === "neon") {
        document.documentElement.classList.add('neon-theme');
        document.documentElement.classList.add(`neon-${themeId}`);
      } else {
        document.documentElement.classList.remove('neon-theme');
        themeOptions
          .filter(t => t.type === "neon")
          .forEach(t => document.documentElement.classList.remove(`neon-${t.id}`));
      }
    }
    
    toast({
      title: "Theme updated",
      description: `Theme changed to ${themeOptions.find(t => t.id === themeId)?.name || themeId}.`
    });
  };
  
  return (
    <Tabs defaultValue="api">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="api">API Settings</TabsTrigger>
        <TabsTrigger value="theme">Theme</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>
      
      <TabsContent value="api" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="gemini-api-key">Gemini API Key</Label>
          <Input
            id="gemini-api-key"
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="openai-api-key">OpenAI API Key</Label>
          <Input
            id="openai-api-key"
            type="password"
            placeholder="Enter your OpenAI API key"
            value={openAiKey}
            onChange={(e) => setOpenAiKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="anthropic-api-key">Anthropic/Claude API Key</Label>
          <Input
            id="anthropic-api-key"
            type="password"
            placeholder="Enter your Anthropic API key"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="perplexity-api-key">Perplexity API Key</Label>
          <Input
            id="perplexity-api-key"
            type="password"
            placeholder="Enter your Perplexity API key"
            value={perplexityKey}
            onChange={(e) => setPerplexityKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="groq-api-key">Groq API Key</Label>
          <Input
            id="groq-api-key"
            type="password"
            placeholder="Enter your Groq API key"
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
              <SelectItem value="vertex-text">Vertex AI Text</SelectItem>
              <SelectItem value="vertex-code">Vertex AI Code</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="token-limit">Token Limit</Label>
          <Select value={tokenLimit} onValueChange={setTokenLimit}>
            <SelectTrigger id="token-limit">
              <SelectValue placeholder="Select token limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8000">8K tokens</SelectItem>
              <SelectItem value="16000">16K tokens</SelectItem>
              <SelectItem value="32000">32K tokens</SelectItem>
              <SelectItem value="64000">64K tokens</SelectItem>
              <SelectItem value="128000">128K tokens</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="use-vision"
            checked={useVision}
            onCheckedChange={setUseVision}
          />
          <Label htmlFor="use-vision">Enable Vision capabilities</Label>
        </div>
        
        <Button onClick={handleSaveApiSettings} className="w-full">
          Save API Settings
        </Button>
      </TabsContent>
      
      <TabsContent value="theme" className="space-y-4 mt-4">
        <div className="space-y-4">
          <Label>Theme Options</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {themeOptions.map((theme) => (
              <Button
                key={theme.id}
                variant={selectedTheme === theme.id ? "default" : "outline"}
                className={`flex items-center gap-2 justify-start h-16 ${
                  theme.type === "neon" ? "border-2" : ""
                }`}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div className={`p-1 rounded-md ${
                  theme.type === "dark" ? "bg-slate-800 text-white" : 
                  theme.type === "light" ? "bg-slate-200 text-black" :
                  `bg-gradient-to-r ${
                    theme.id === "neon-purple" ? "from-purple-500 to-pink-500" :
                    theme.id === "neon-blue" ? "from-blue-500 to-cyan-500" :
                    "from-yellow-500 to-red-500"
                  } text-white`
                }`}>
                  {theme.icon}
                </div>
                <span>{theme.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="mt-4">
            <Label className="block mb-2">Preview</Label>
            <div className={`p-4 rounded-md border ${
              selectedTheme.includes("dark") ? "bg-gray-800 text-white" : 
              selectedTheme.includes("light") ? "bg-gray-100 text-black" :
              selectedTheme === "neon-purple" ? "bg-black text-purple-400 border-purple-500" :
              selectedTheme === "neon-blue" ? "bg-black text-blue-400 border-blue-500" :
              "bg-black text-yellow-400 border-yellow-500"
            }`}>
              <p>This is how your selected theme will look.</p>
              <button className={`mt-2 px-3 py-1 rounded-md ${
                selectedTheme.includes("dark") ? "bg-slate-700 text-white" : 
                selectedTheme.includes("light") ? "bg-white text-black border border-gray-300" :
                selectedTheme === "neon-purple" ? "bg-purple-900 text-purple-200 border border-purple-500" :
                selectedTheme === "neon-blue" ? "bg-blue-900 text-blue-200 border border-blue-500" :
                "bg-yellow-900 text-yellow-200 border border-yellow-500"
              }`}>Sample Button</button>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="preferences" className="space-y-4 mt-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-title"
            checked={autoTitle}
            onCheckedChange={setAutoTitle}
          />
          <Label htmlFor="auto-title">Auto-generate conversation titles</Label>
        </div>
        
        <Button onClick={handleSavePreferences} className="w-full">
          Save Preferences
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default Settings;
