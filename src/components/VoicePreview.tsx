
import { useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoicePreviewService } from "@/services/voicePreviewService";
import { useToast } from "@/hooks/use-toast";

interface VoicePreviewProps {
  voice: string;
  voiceName: string;
  apiKey?: string;
}

const VoicePreview = ({ voice, voiceName, apiKey }: VoicePreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const sampleText = `Hello! I'm ${voiceName}. This is how I sound when speaking. I'm ready to assist you with your needs.`;

  const handlePreview = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your OpenAI API key in settings to preview voices.",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const previewService = new VoicePreviewService(apiKey);
      await previewService.previewVoice(sampleText, voice);
      
      // Auto-stop after estimated duration
      setTimeout(() => {
        setIsPlaying(false);
      }, 5000);
      
    } catch (error) {
      console.error('Voice preview error:', error);
      toast({
        title: "Preview Failed",
        description: "Could not play voice preview. Please check your API key.",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handlePreview}
      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
    >
      {isPlaying ? (
        <Square className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4" />
      )}
    </Button>
  );
};

export default VoicePreview;
