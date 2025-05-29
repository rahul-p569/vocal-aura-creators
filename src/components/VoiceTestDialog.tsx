
import { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Agent } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { OpenAIRealtimeService } from "@/services/openaiService";

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
  const realtimeServiceRef = useRef<OpenAIRealtimeService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

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

  const getApiKey = () => {
    const settings = localStorage.getItem("voiceai_settings");
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.apiKeys?.openai;
    }
    return null;
  };

  const setupMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && realtimeServiceRef.current) {
          const arrayBuffer = await event.data.arrayBuffer();
          realtimeServiceRef.current.sendAudioData(arrayBuffer);
        }
      };

      mediaRecorder.start(100); // Send audio chunks every 100ms
      mediaRecorderRef.current = mediaRecorder;

    } catch (error) {
      console.error('Error setting up media recorder:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your OpenAI API key in settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Initialize OpenAI Realtime Service
      const realtimeService = new OpenAIRealtimeService({
        apiKey,
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: agent.voice,
        instructions: agent.prompt || `You are ${agent.name}, ${agent.description}. Be helpful and natural in your responses.`
      });

      realtimeService.onConnected(() => {
        setIsConnected(true);
        setConnectionTime(0);
        setTranscript([`${agent.name}: Hello! I'm ${agent.name}. How can I help you today?`]);
        setupMediaRecorder();
      });

      realtimeService.onMessageReceived((message) => {
        console.log('Received message:', message);
        
        if (message.type === 'response.audio_transcript.delta') {
          // Handle audio transcript
          const text = message.delta;
          if (text) {
            setTranscript(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.startsWith(`${agent.name}:`)) {
                // Update the last agent message
                const updated = [...prev];
                updated[updated.length - 1] = lastMessage + text;
                return updated;
              } else {
                // Add new agent message
                return [...prev, `${agent.name}: ${text}`];
              }
            });
          }
        } else if (message.type === 'input_audio_buffer.speech_started') {
          // User started speaking
          console.log('User started speaking');
        } else if (message.type === 'input_audio_buffer.speech_stopped') {
          // User stopped speaking
          console.log('User stopped speaking');
        } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
          // User speech transcription completed
          const transcript = message.transcript;
          if (transcript) {
            setTranscript(prev => [...prev, `You: ${transcript}`]);
          }
        }
      });

      realtimeService.onErrorOccurred((error) => {
        console.error('Realtime service error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to OpenAI Realtime API. Please check your API key.",
          variant: "destructive",
        });
        setIsConnected(false);
      });

      realtimeService.onDisconnected(() => {
        setIsConnected(false);
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        }
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
      });

      realtimeServiceRef.current = realtimeService;
      await realtimeService.connect();
      
      toast({
        title: "Connected",
        description: `Connected to ${agent.name} via OpenAI Realtime API`,
      });

    } catch (error) {
      console.error('Connection error:', error);
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
    if (realtimeServiceRef.current) {
      realtimeServiceRef.current.disconnect();
      realtimeServiceRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    setIsConnected(false);
    setConnectionTime(0);
    setTranscript([]);
    
    toast({
      title: "Disconnected",
      description: "Voice call ended",
    });
  };

  const handleMuteToggle = () => {
    if (audioStreamRef.current) {
      const audioTracks = audioStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const simulateUserInput = () => {
    if (realtimeServiceRef.current) {
      const userMessage = "Hi there, I'd like some information about your services.";
      realtimeServiceRef.current.sendTextMessage(userMessage);
      setTranscript(prev => [...prev, `You: ${userMessage}`]);
    }
  };

  // Cleanup on dialog close
  useEffect(() => {
    if (!isOpen && isConnected) {
      handleDisconnect();
    }
  }, [isOpen]);

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
                  isConnected ? "bg-green-400 animate-pulse" : "bg-gray-500"
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
            <h3 className="text-white font-medium mb-3">Real-time Conversation</h3>
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
                {isLoading ? "Connecting..." : "Start Real Voice Test"}
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
                  onClick={handleMuteToggle}
                  variant="outline"
                  className={`border-gray-600 ${
                    isMuted 
                      ? "text-red-400 hover:bg-red-600/10 border-red-600" 
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
                  Send Text
                </Button>
              </>
            )}
          </div>

          {/* Note */}
          <div className="text-sm text-gray-400 bg-gray-800/30 p-3 rounded">
            <strong>Live OpenAI Integration:</strong> This connects to the OpenAI Realtime API for actual voice conversations. 
            Make sure your browser allows microphone access and your API key is properly configured.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceTestDialog;
