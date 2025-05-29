import { useState, useEffect } from "react";
import { Settings, Key, Phone, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    plivo: "",
    twilio: "",
  });
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem("voiceai_settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setApiKeys(settings.apiKeys || {
          openai: "",
          plivo: "",
          twilio: "",
        });
        setWebhookUrl(settings.webhookUrl || "");
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    const settings = {
      apiKeys,
      webhookUrl,
    };
    localStorage.setItem("voiceai_settings", JSON.stringify(settings));
    
    toast({
      title: "Settings Saved",
      description: "Your API keys and settings have been saved successfully.",
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Settings className="w-6 h-6 text-blue-400" />
            <span>Platform Settings</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your API keys and platform integrations for voice agents.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="telephony">Telephony</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4 mt-6">
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Key className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-medium">API Configuration</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Configure your API keys to enable voice agents and telephony integrations.
              </p>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="openai-key" className="text-gray-300">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="sk-..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Required for OpenAI Realtime API voice functionality
                </p>
              </div>

              <div>
                <Label htmlFor="plivo-key" className="text-gray-300">Plivo API Key</Label>
                <Input
                  id="plivo-key"
                  type="password"
                  value={apiKeys.plivo}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, plivo: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="Your Plivo API key"
                />
              </div>

              <div>
                <Label htmlFor="twilio-key" className="text-gray-300">Twilio API Key</Label>
                <Input
                  id="twilio-key"
                  type="password"
                  value={apiKeys.twilio}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, twilio: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="Your Twilio API key"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="telephony" className="space-y-4 mt-6">
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Phone className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-medium">Telephony Settings</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Configure how your voice agents integrate with phone systems.
              </p>
            </Card>

            <div className="space-y-4">
              <Card className="bg-gray-800/30 border-gray-600 p-4">
                <h4 className="text-white font-medium mb-2">Plivo Integration</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">• Voice calls and SMS</div>
                  <div className="text-gray-300">• Global phone numbers</div>
                  <div className="text-gray-300">• Advanced call routing</div>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-3 border-green-600 text-green-400 hover:bg-green-600/10"
                >
                  Configure Plivo
                </Button>
              </Card>

              <Card className="bg-gray-800/30 border-gray-600 p-4">
                <h4 className="text-white font-medium mb-2">Twilio Integration</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-300">• Voice and video calls</div>
                  <div className="text-gray-300">• Programmable messaging</div>
                  <div className="text-gray-300">• WebRTC support</div>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-3 border-blue-600 text-blue-400 hover:bg-blue-600/10"
                >
                  Configure Twilio
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4 mt-6">
            <Card className="bg-gray-800/50 border-gray-700 p-4">
              <h3 className="text-white font-medium mb-2">Webhook Configuration</h3>
              <p className="text-gray-400 text-sm">
                Set up webhooks to receive real-time notifications about agent activities.
              </p>
            </Card>

            <div>
              <Label htmlFor="webhook-url" className="text-gray-300">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white mt-1"
                placeholder="https://your-domain.com/webhook"
              />
              <p className="text-xs text-gray-400 mt-1">
                This URL will receive POST requests for agent events
              </p>
            </div>

            <Card className="bg-gray-800/30 border-gray-600 p-4">
              <h4 className="text-white font-medium mb-2">Webhook Events</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>• call.started - When a voice call begins</div>
                <div>• call.ended - When a voice call ends</div>
                <div>• agent.created - When a new agent is created</div>
                <div>• agent.updated - When an agent is modified</div>
                <div>• error.occurred - When an error happens</div>
              </div>
            </Card>
          </TabsContent>

          <div className="flex space-x-3 pt-6 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
