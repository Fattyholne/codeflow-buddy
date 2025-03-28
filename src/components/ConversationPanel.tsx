
import React from "react";
import { Conversation, Message } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ConversationPanelProps {
  conversation: Conversation;
  isStreaming: boolean;
  messageEndRef: React.RefObject<HTMLDivElement>;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversation,
  isStreaming,
  messageEndRef
}) => {
  if (!conversation) return null;

  return (
    <div className="space-y-4 mb-4">
      {conversation.messages.length === 0 ? (
        <EmptyConversation />
      ) : (
        conversation.messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={index === conversation.messages.length - 1}
          />
        ))
      )}
      <div ref={messageEndRef} />
    </div>
  );
};

const EmptyConversation = () => (
  <div className="flex flex-col items-center justify-center h-[50vh] text-center">
    <Bot size={48} className="text-primary mb-4" />
    <h2 className="text-2xl font-bold mb-2">Dartopia AI Assistant</h2>
    <p className="text-muted-foreground max-w-md">
      Type a message below to start a conversation with your AI assistant.
      Ask coding questions, request explanations, or get help with your project.
    </p>
  </div>
);

const MessageItem: React.FC<{ message: Message; isLast: boolean }> = ({ message, isLast }) => {
  const isUser = message.role === "user";
  
  return (
    <div className={cn(
      "flex gap-4",
      isUser ? "flex-row" : "flex-row"
    )}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm",
        isUser ? "bg-background" : "bg-primary"
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4 text-primary-foreground" />
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <Card className={cn(
          "p-4 overflow-hidden",
          message.status === "error" && "border-destructive"
        )}>
          <div className="prose prose-sm dark:prose-invert max-w-none w-full break-words">
            {message.status === "sending" && isLast ? (
              <>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                <div className="mt-2 flex items-center">
                  <Skeleton className="h-4 w-4 rounded-full animate-pulse bg-muted" />
                  <Skeleton className="h-4 w-4 rounded-full animate-pulse bg-muted ml-1" />
                  <Skeleton className="h-4 w-4 rounded-full animate-pulse bg-muted ml-1" />
                </div>
              </>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
          
          {message.tokenCount && (
            <div className="mt-2 text-xs text-muted-foreground">
              Tokens: {message.tokenCount}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConversationPanel;
