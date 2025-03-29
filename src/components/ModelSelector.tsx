
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
  useContextChunking?: boolean;
  onToggleContextChunking?: (enabled: boolean) => void;
}

const models = [
  { id: "gemini-pro", name: "Gemini Pro" },
  { id: "gemini-pro-vision", name: "Gemini Pro Vision" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  { id: "vertex-ai-model", name: "Vertex AI Model" },
  { id: "palm2", name: "PaLM 2" }
];

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onChange,
  useContextChunking = false,
  onToggleContextChunking
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Model</h3>
      <Select value={selectedModel} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {onToggleContextChunking && (
        <div className="flex items-center justify-between mt-4">
          <div className="space-y-0.5">
            <Label htmlFor="context-chunking">Context Chunking</Label>
            <p className="text-xs text-muted-foreground">Only send relevant conversation parts to the API</p>
          </div>
          <Switch
            id="context-chunking"
            checked={useContextChunking}
            onCheckedChange={onToggleContextChunking}
          />
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
