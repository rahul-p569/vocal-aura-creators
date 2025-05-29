
import { Settings, Phone, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header = ({ onOpenSettings }: HeaderProps) => {
  return (
    <header className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">VoiceAI Platform</h1>
              <p className="text-sm text-gray-400">Intelligent Voice Agents</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-300">
              <Phone className="w-4 h-4" />
              <span className="text-sm">Telephony Ready</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Real-time AI</span>
            </div>
          </nav>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
