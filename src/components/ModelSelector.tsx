
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
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
  onChange
}) => {
  return (
    <div className="space-y-2">
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
    </div>
  );
};

export default ModelSelector;
