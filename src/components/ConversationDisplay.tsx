
import { useState, useRef, useEffect } from "react";
import { User, Bot, Mic, MicOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isComplete: boolean;
}

interface ConversationDisplayProps {
  messages: ConversationMessage[];
  isUserSpeaking?: boolean;
  isAssistantSpeaking?: boolean;
  className?: string;
}

const ConversationDisplay = ({ 
  messages, 
  isUserSpeaking = false, 
  isAssistantSpeaking = false,
  className = ""
}: ConversationDisplayProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-medium flex items-center space-x-2">
          <span>Real-time Conversation</span>
          {isUserSpeaking && (
            <div className="flex items-center space-x-1 text-blue-400">
              <Mic className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Listening...</span>
            </div>
          )}
          {isAssistantSpeaking && (
            <div className="flex items-center space-x-1 text-purple-400">
              <Bot className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Speaking...</span>
            </div>
          )}
        </h3>
      </div>
      
      <ScrollArea className="h-80 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              Start a conversation to see transcripts here
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? "bg-blue-500/20 text-blue-200"
                      : "bg-purple-500/20 text-purple-200"
                  } ${!message.isComplete ? 'opacity-70' : ''}`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {formatTime(message.timestamp)}
                    {!message.isComplete && (
                      <span className="ml-2 animate-pulse">●</span>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ConversationDisplay;
