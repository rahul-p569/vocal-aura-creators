
import { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Agent } from "@/types/agent";
import { useToast } from "@/hooks/use-toast";
import { OpenAIRealtimeService } from "@/services/openaiService";
import ConversationDisplay from "./ConversationDisplay";

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isComplete: boolean;
}

interface VoiceTestDialogProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

const VoiceTestDialog = ({ agent, isOpen, onClose }: VoiceTestDialogProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [connectionTime, setConnectionTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const { toast } = useToast();

  const intervalRef = useRef<NodeJS.Timeout>();
  const realtimeServiceRef = useRef<OpenAIRealtimeService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const currentAssistantMessageRef = useRef<string>('');

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

  const addMessage = (type: 'user' | 'assistant', content: string, isComplete: boolean = true) => {
    const messageId = `${type}_${Date.now()}_${Math.random()}`;
    setMessages(prev => [...prev, {
      id: messageId,
      type,
      content,
      timestamp: new Date(),
      isComplete
    }]);
    return messageId;
  };

  const updateMessage = (messageId: string, content: string, isComplete: boolean = false) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isComplete }
        : msg
    ));
  };

  const setupMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
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

      mediaRecorder.start(100);
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
      const realtimeService = new OpenAIRealtimeService({
        apiKey,
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: agent.voice,
        instructions: agent.prompt || `You are ${agent.name}, ${agent.description}. Be helpful and natural in your responses.`
      });

      realtimeService.onConnected(() => {
        setIsConnected(true);
        setConnectionTime(0);
        addMessage('assistant', `Hello! I'm ${agent.name}. How can I help you today?`);
        setupMediaRecorder();
      });

      realtimeService.onMessageReceived((message) => {
        console.log('Received message:', message);
        
        if (message.type === 'response.audio_transcript.delta') {
          const text = message.delta;
          if (text) {
            currentAssistantMessageRef.current += text;
            // Update or create assistant message
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.type === 'assistant' && !lastMessage.isComplete) {
                return prev.map((msg, index) => 
                  index === prev.length - 1 
                    ? { ...msg, content: currentAssistantMessageRef.current }
                    : msg
                );
              } else {
                return [...prev, {
                  id: `assistant_${Date.now()}`,
                  type: 'assistant',
                  content: currentAssistantMessageRef.current,
                  timestamp: new Date(),
                  isComplete: false
                }];
              }
            });
          }
        } else if (message.type === 'response.audio_transcript.done') {
          // Mark assistant message as complete
          setMessages(prev => prev.map((msg, index) => 
            index === prev.length - 1 && msg.type === 'assistant'
              ? { ...msg, isComplete: true }
              : msg
          ));
          currentAssistantMessageRef.current = '';
          setIsAssistantSpeaking(false);
        } else if (message.type === 'input_audio_buffer.speech_started') {
          setIsUserSpeaking(true);
        } else if (message.type === 'input_audio_buffer.speech_stopped') {
          setIsUserSpeaking(false);
        } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
          const transcript = message.transcript;
          if (transcript) {
            addMessage('user', transcript);
          }
        } else if (message.type === 'response.audio.delta') {
          setIsAssistantSpeaking(true);
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
        setIsUserSpeaking(false);
        setIsAssistantSpeaking(false);
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
    setMessages([]);
    setIsUserSpeaking(false);
    setIsAssistantSpeaking(false);
    currentAssistantMessageRef.current = '';
    
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

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    // TODO: Implement actual volume control for audio output
  };

  useEffect(() => {
    if (!isOpen && isConnected) {
      handleDisconnect();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Phone className="w-6 h-6 text-blue-400" />
            <span>Voice Test - {agent.name}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Test your voice agent with real-time speech-to-speech conversation using OpenAI Realtime API.
          </DialogDescription>
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
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Voice: {agent.voice}</span>
                </div>
                {isConnected && (
                  <div className="flex items-center space-x-2">
                    <VolumeX className="w-4 h-4 text-gray-400" />
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-400 w-8">{volume}%</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Conversation Display */}
          <ConversationDisplay 
            messages={messages}
            isUserSpeaking={isUserSpeaking}
            isAssistantSpeaking={isAssistantSpeaking}
          />

          {/* Controls */}
          <div className="flex space-x-3">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                {isLoading ? "Connecting..." : "Start Voice Conversation"}
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
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
              </>
            )}
          </div>

          {/* Note */}
          <div className="text-sm text-gray-400 bg-gray-800/30 p-3 rounded">
            <strong>Real-time Speech Conversation:</strong> This connects directly to OpenAI's Realtime API for 
            natural voice conversations. Speak naturally and the AI will respond with voice and text transcription.
            Make sure your browser allows microphone access.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceTestDialog;
