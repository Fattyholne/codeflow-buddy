
import React, { useState, useEffect, useRef } from "react";
import ConversationPanel from "@/components/ConversationPanel";
import MessageInput from "@/components/MessageInput";
import Sidebar from "@/components/Sidebar";
import TokenUsage from "@/components/TokenUsage";
import Settings from "@/components/Settings";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
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
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  status: "sending" | "complete" | "error";
  tokenCount?: number;
}

const Index = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>("conversations", []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage<string>("activeConversationId", "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Create a default conversation if none exists
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
      }
    };
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

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
    
    // Create new message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      status: "complete",
      tokenCount: estimateTokenCount(message)
    };
    
    // Add to conversation
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
    
    // Update title if this is the first message
    if (updatedConversation.messages.length === 1) {
      updatedConversation.title = generateTitleFromMessage(message);
    }
    
    updateConversation(updatedConversation);
    
    // Create placeholder for AI response
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
      
      // Process the response with simulated streaming
      await processStreamingResponse(response, aiMessage.id);
      
      setIsStreaming(false);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Update AI message with error status
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
      // Simulate streaming by updating the message content word by word
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
      
      // Scroll to the latest message
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      // Add a small delay to simulate streaming
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

  // Mock functions - would be replaced with real implementation
  const sendMessageToAPI = async (message: string, conversationHistory: Message[]): Promise<string> => {
    // This would be replaced with your actual API call
    console.log("Sending message to API:", message);
    console.log("Conversation history:", conversationHistory);
    
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return "This is a simulated response from the Dartopia AI assistant. In a real implementation, this would be connected to your Gemini and Vertex AI APIs. The response would be streamed in real-time, providing immediate feedback as the AI generates its response. This interface is designed to handle large token contexts without performance degradation, maintain persistent conversations, and integrate seamlessly with your development workflow.";
  };

  const estimateTokenCount = (text: string): number => {
    // Simple token estimation (about 4 chars per token)
    return Math.ceil(text.length / 4);
  };

  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  const generateTitleFromMessage = (message: string): string => {
    // Create a title from the first few words of the message
    const words = message.split(' ').slice(0, 5);
    return words.join(' ') + (words.length < message.split(' ').length ? '...' : '');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          <ConversationPanel 
            conversation={activeConversation}
            isStreaming={isStreaming}
            messageEndRef={messageEndRef}
          />
        </div>
        
        <Separator className="mb-2" />
        
        <div className="p-4 bg-card rounded-t-lg border-t">
          <TokenUsage tokenUsage={activeConversation.tokenUsage} />
          <MessageInput 
            onSendMessage={handleSendMessage}
            isDisabled={isStreaming}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
