
import { useState } from "react";
import { Brain, Upload, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Agent } from "@/types/agent";

interface CreateAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (agent: Omit<Agent, "id" | "totalCalls" | "avgDuration" | "successRate" | "createdAt">) => void;
}

const voices = [
  { id: "alloy", name: "Alloy", description: "Balanced and clear" },
  { id: "echo", name: "Echo", description: "Professional and warm" },
  { id: "fable", name: "Fable", description: "Expressive and dynamic" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Bright and energetic" },
  { id: "shimmer", name: "Shimmer", description: "Gentle and soothing" },
];

const CreateAgentDialog = ({ isOpen, onClose, onCreateAgent }: CreateAgentDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    voice: "",
    prompt: "",
    telephonyProvider: "",
    phoneNumber: "",
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const agentData: Omit<Agent, "id" | "totalCalls" | "avgDuration" | "successRate" | "createdAt"> = {
      name: formData.name,
      description: formData.description,
      voice: formData.voice,
      status: "inactive",
      knowledgeBase: knowledgeFiles,
      prompt: formData.prompt,
      telephonyIntegration: formData.telephonyProvider ? {
        provider: formData.telephonyProvider as "plivo" | "twilio",
        phoneNumber: formData.phoneNumber,
      } : undefined,
    };

    onCreateAgent(agentData);
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      voice: "",
      prompt: "",
      telephonyProvider: "",
      phoneNumber: "",
    });
    setKnowledgeFiles([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileNames = files.map(file => file.name);
    setKnowledgeFiles(prev => [...prev, ...fileNames]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Brain className="w-6 h-6 text-blue-400" />
            <span>Create New Voice Agent</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Agent Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white mt-1"
                placeholder="e.g., Sales Assistant"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white mt-1"
                placeholder="What does this agent do?"
                required
              />
            </div>
          </div>

          {/* Voice Selection */}
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

          {/* System Prompt */}
          <div>
            <Label htmlFor="prompt" className="text-gray-300">System Prompt (Optional)</Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white mt-1"
              placeholder="Customize how your agent behaves..."
              rows={4}
            />
          </div>

          {/* Knowledge Base */}
          <div>
            <Label className="text-gray-300">Knowledge Base</Label>
            <div className="mt-2">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">Upload documents to train your agent</p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="knowledge-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("knowledge-upload")?.click()}
                  className="border-gray-600 text-gray-300"
                >
                  Choose Files
                </Button>
              </div>
              {knowledgeFiles.length > 0 && (
                <div className="mt-3 space-y-1">
                  {knowledgeFiles.map((file, index) => (
                    <div key={index} className="text-sm text-gray-400 bg-gray-800 px-3 py-2 rounded">
                      {file}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Telephony Integration */}
          <div className="space-y-4">
            <Label className="text-gray-300 flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Telephony Integration (Optional)</span>
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
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
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
              disabled={!formData.name || !formData.description || !formData.voice}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Create Agent
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentDialog;
