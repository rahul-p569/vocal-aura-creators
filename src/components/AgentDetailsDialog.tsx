
import { useState } from "react";
import { Brain, Upload, Phone, Save, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Agent } from "@/types/agent";

interface AgentDetailsDialogProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (agent: Agent) => void;
}

const voices = [
  { id: "alloy", name: "Alloy", description: "Balanced and clear" },
  { id: "echo", name: "Echo", description: "Professional and warm" },
  { id: "fable", name: "Fable", description: "Expressive and dynamic" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Bright and energetic" },
  { id: "shimmer", name: "Shimmer", description: "Gentle and soothing" },
];

const AgentDetailsDialog = ({ agent, isOpen, onClose, onUpdate }: AgentDetailsDialogProps) => {
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description,
    voice: agent.voice,
    prompt: agent.prompt || "",
    telephonyProvider: agent.telephonyIntegration?.provider || "",
    phoneNumber: agent.telephonyIntegration?.phoneNumber || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAgent: Agent = {
      ...agent,
      name: formData.name,
      description: formData.description,
      voice: formData.voice,
      prompt: formData.prompt,
      telephonyIntegration: formData.telephonyProvider ? {
        provider: formData.telephonyProvider as "plivo" | "twilio",
        phoneNumber: formData.phoneNumber,
      } : undefined,
    };

    onUpdate(updatedAgent);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Brain className="w-6 h-6 text-blue-400" />
            <span>Agent Settings - {agent.name}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="voice">Voice & AI</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="telephony">Telephony</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="general" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="name" className="text-gray-300">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  rows={3}
                />
              </div>

              {/* Agent Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card className="bg-gray-800/50 border-gray-700 p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{agent.totalCalls}</div>
                    <div className="text-gray-400 text-sm">Total Calls</div>
                  </div>
                </Card>
                <Card className="bg-gray-800/50 border-gray-700 p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{agent.avgDuration}</div>
                    <div className="text-gray-400 text-sm">Avg Duration</div>
                  </div>
                </Card>
                <Card className="bg-gray-800/50 border-gray-700 p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{agent.successRate}%</div>
                    <div className="text-gray-400 text-sm">Success Rate</div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4 mt-6">
              <div>
                <Label className="text-gray-300">Voice Selection</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {voices.map((voice) => (
                    <Card
                      key={voice.id}
                      className={`p-4 cursor-pointer transition-all border ${
                        formData.voice === voice.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, voice: voice.id }))}
                    >
                      <div className="text-white font-medium">{voice.name}</div>
                      <div className="text-gray-400 text-sm">{voice.description}</div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="prompt" className="text-gray-300">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="Customize how your agent behaves..."
                  rows={6}
                />
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-4 mt-6">
              <div>
                <Label className="text-gray-300">Knowledge Base Documents</Label>
                <div className="mt-2 space-y-2">
                  {agent.knowledgeBase.map((file, index) => (
                    <Card key={index} className="bg-gray-800/50 border-gray-700 p-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span className="text-white">{file}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 ml-auto"
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors mt-4">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">Add more documents to train your agent</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    Upload Files
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="telephony" className="space-y-4 mt-6">
              <div className="space-y-4">
                <Label className="text-gray-300 flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Telephony Integration</span>
                </Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider" className="text-gray-300">Provider</Label>
                    <Select
                      value={formData.telephonyProvider}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, telephonyProvider: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="plivo">Plivo</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="text-gray-300">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white mt-1"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                {formData.telephonyProvider && (
                  <Card className="bg-gray-800/50 border-gray-700 p-4">
                    <h4 className="text-white font-medium mb-2">Integration Status</h4>
                    <div className="text-green-400 text-sm">
                      ✓ {formData.telephonyProvider.charAt(0).toUpperCase() + formData.telephonyProvider.slice(1)} integration configured
                    </div>
                    {formData.phoneNumber && (
                      <div className="text-gray-300 text-sm mt-1">
                        Phone Number: {formData.phoneNumber}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </TabsContent>

            <div className="flex space-x-3 pt-6 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailsDialog;
