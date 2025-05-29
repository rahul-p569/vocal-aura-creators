
import { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Agent } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";

interface VoiceTestDialogProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

const VoiceTestDialog = ({ agent, isOpen, onClose }: VoiceTestDialogProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [connectionTime, setConnectionTime] = useState(0);
  const { toast } = useToast();

  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isConnected && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setConnectionTime(prev => prev + 1);
      }, 1000);
    } else if (!isConnected && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setConnectionTime(0);
      setTranscript([
        `${agent.name}: Hello! I'm ${agent.name}. How can I help you today?`
      ]);
      
      toast({
        title: "Connected",
        description: `Connected to ${agent.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the voice agent. Please check your OpenAI API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionTime(0);
    setTranscript([]);
    toast({
      title: "Disconnected",
      description: "Voice call ended",
    });
  };

  const simulateUserInput = () => {
    const userMessage = "Hi there, I'd like some information about your services.";
    const agentResponse = `${agent.name}: Of course! I'd be happy to help you with information about our services. Based on my knowledge base, I can provide details about our offerings and answer any specific questions you might have.`;
    
    setTranscript(prev => [
      ...prev,
      `You: ${userMessage}`,
      agentResponse
    ]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Phone className="w-6 h-6 text-blue-400" />
            <span>Voice Test - {agent.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-gray-500"
                }`} />
                <span className="text-white font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
                {isConnected && (
                  <span className="text-gray-400">
                    {formatTime(connectionTime)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Voice: {agent.voice}</span>
              </div>
            </div>
          </Card>

          {/* Conversation */}
          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <h3 className="text-white font-medium mb-3">Conversation</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {transcript.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  Start a voice test to see the conversation here
                </div>
              ) : (
                transcript.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded ${
                      message.startsWith('You:')
                        ? "bg-blue-500/20 text-blue-200"
                        : "bg-purple-500/20 text-purple-200"
                    }`}
                  >
                    {message}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Controls */}
          <div className="flex space-x-3">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                {isLoading ? "Connecting..." : "Start Voice Test"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleDisconnect}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
                
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant="outline"
                  className={`border-gray-600 ${
                    isMuted 
                      ? "text-red-400 hover:bg-red-600/10" 
                      : "text-gray-300 hover:bg-gray-600/10"
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={simulateUserInput}
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                >
                  Say Something
                </Button>
              </>
            )}
          </div>

          {/* Note */}
          <div className="text-sm text-gray-400 bg-gray-800/30 p-3 rounded">
            <strong>Note:</strong> This is a test interface. To enable real voice functionality, 
            you'll need to provide your OpenAI API key in the settings and configure the Realtime API integration.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceTestDialog;
