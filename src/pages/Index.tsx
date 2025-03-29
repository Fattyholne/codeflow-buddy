
import React, { useState, useEffect, useRef } from "react";
import ConversationPanel from "@/components/ConversationPanel";
import MessageInput from "@/components/MessageInput";
import Sidebar from "@/components/Sidebar";
import TokenUsage from "@/components/TokenUsage";
import Settings from "@/components/Settings";
import SystemInstructions from "@/components/SystemInstructions";
import ModelSelector from "@/components/ModelSelector";
import ToolsPanel from "@/components/ToolsPanel";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  systemInstructions?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  status: "sending" | "complete" | "error";
  tokenCount?: number;
}

const defaultConversation: Conversation = {
  id: "default",
  title: "New Conversation",
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tokenUsage: {
    input: 0,
    output: 0,
    total: 0
  },
  systemInstructions: "You are Dartopia, an AI assistant specialized in dart scoring and analysis."
};

const Index = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>("conversations", []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage<string>("activeConversationId", "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [selectedModel, setSelectedModel] = useState("gemini-pro");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = createNewConversation();
      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
    } else if (!activeConversationId || !conversations.find(c => c.id === activeConversationId)) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const createNewConversation = (): Conversation => {
    return {
      id: generateId(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenUsage: {
        input: 0,
        output: 0,
        total: 0
      },
      systemInstructions: defaultConversation.systemInstructions
    };
  };

  // Fixed: Ensure we always have a valid conversation by using defaultConversation as fallback
  const activeConversation = conversations.find(c => c.id === activeConversationId) || 
    (conversations.length > 0 ? conversations[0] : defaultConversation);

  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    setConversations([...conversations, newConversation]);
    setActiveConversationId(newConversation.id);
    toast({
      title: "New conversation created",
      description: "Start a fresh conversation with the AI assistant."
    });
  };

  const handleDeleteConversation = (id: string) => {
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    
    if (id === activeConversationId && updatedConversations.length > 0) {
      setActiveConversationId(updatedConversations[0].id);
    }
    
    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed."
    });
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      status: "complete",
      tokenCount: estimateTokenCount(message)
    };
    
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
      tokenUsage: {
        ...activeConversation.tokenUsage,
        input: activeConversation.tokenUsage.input + (userMessage.tokenCount || 0),
        total: activeConversation.tokenUsage.total + (userMessage.tokenCount || 0)
      }
    };
    
    if (updatedConversation.messages.length === 1) {
      updatedConversation.title = generateTitleFromMessage(message);
    }
    
    updateConversation(updatedConversation);
    
    const aiMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      status: "sending"
    };
    
    const conversationWithAiResponse = {
      ...updatedConversation,
      messages: [...updatedConversation.messages, aiMessage]
    };
    
    updateConversation(conversationWithAiResponse);
    
    try {
      setIsStreaming(true);
      const response = await sendMessageToAPI(message, activeConversation.messages);
      
      await processStreamingResponse(response, aiMessage.id);
      
      setIsStreaming(false);
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        ...aiMessage,
        content: "Sorry, there was an error processing your request. Please try again.",
        status: "error"
      };
      
      const conversationWithError = {
        ...conversationWithAiResponse,
        messages: conversationWithAiResponse.messages.map(m => 
          m.id === aiMessage.id ? errorMessage : m
        )
      };
      
      updateConversation(conversationWithError);
      setIsStreaming(false);
      
      toast({
        title: "Error",
        description: "Failed to get a response from the AI service.",
        variant: "destructive"
      });
    }
  };

  const processStreamingResponse = async (fullResponse: string, messageId: string) => {
    const words = fullResponse.split(' ');
    let currentContent = '';
    const tokenCount = estimateTokenCount(fullResponse);
    
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      const updatedMessage: Message = {
        ...activeConversation.messages.find(m => m.id === messageId)!,
        content: currentContent,
        status: i === words.length - 1 ? "complete" : "sending",
        tokenCount: i === words.length - 1 ? tokenCount : undefined
      };
      
      const updatedConversation = {
        ...activeConversation,
        messages: activeConversation.messages.map(m => 
          m.id === messageId ? updatedMessage : m
        ),
        tokenUsage: i === words.length - 1 ? {
          ...activeConversation.tokenUsage,
          output: activeConversation.tokenUsage.output + tokenCount,
          total: activeConversation.tokenUsage.total + tokenCount
        } : activeConversation.tokenUsage
      };
      
      updateConversation(updatedConversation);
      
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };

  const updateConversation = (updatedConversation: Conversation) => {
    setConversations(
      conversations.map(c => 
        c.id === updatedConversation.id ? updatedConversation : c
      )
    );
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const updateSystemInstructions = (instructions: string) => {
    const updatedConversation = {
      ...activeConversation,
      systemInstructions: instructions
    };
    updateConversation(updatedConversation);
  };

  const sendMessageToAPI = async (message: string, conversationHistory: Message[]): Promise<string> => {
    console.log("Sending message to API:", message);
    console.log("Conversation history:", conversationHistory);
    console.log("Using model:", selectedModel);
    console.log("Temperature:", temperature);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return "This is a simulated response from the Dartopia AI assistant. In a real implementation, this would be connected to your Gemini and Vertex AI APIs. The response would be streamed in real-time, providing immediate feedback as the AI generates its response. This interface is designed to handle large token contexts without performance degradation, maintain persistent conversations, and integrate seamlessly with your development workflow.";
  };

  const estimateTokenCount = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  const generateTitleFromMessage = (message: string): string => {
    const words = message.split(' ').slice(0, 5);
    return words.join(' ') + (words.length < message.split(' ').length ? '...' : '');
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto py-4 px-4">
            <SystemInstructions 
              instructions={activeConversation.systemInstructions || ""}
              onUpdate={updateSystemInstructions}
            />
            
            <ConversationPanel 
              conversation={activeConversation}
              isStreaming={isStreaming}
              messageEndRef={messageEndRef}
            />
          </div>
        </div>
        
        <Separator className="mb-2" />
        
        <div className="p-4 bg-card rounded-t-lg border-t">
          <div className="max-w-5xl mx-auto">
            <TokenUsage tokenUsage={activeConversation.tokenUsage} />
            <MessageInput 
              onSendMessage={handleSendMessage}
              isDisabled={isStreaming}
            />
          </div>
        </div>
      </div>
      
      <div className="w-80 border-l p-4 hidden lg:block">
        <div className="space-y-6">
          <ModelSelector 
            selectedModel={selectedModel}
            onChange={setSelectedModel}
          />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Temperature</h3>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-6 text-center">{temperature}</span>
            </div>
          </div>
          
          <ToolsPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
