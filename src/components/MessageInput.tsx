
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isDisabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isDisabled
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize the textarea
      textareaRef.current.style.height = "48px";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message);
      setMessage("");
      
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "48px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mt-2">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={isDisabled}
        className="resize-none pr-12 min-h-[48px] max-h-[200px] overflow-y-auto"
        rows={1}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isDisabled || !message.trim()}
        className="absolute right-2 bottom-2 h-8 w-8"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default MessageInput;
