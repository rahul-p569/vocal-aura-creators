
import { useState } from "react";
import { Play, Pause, Settings, Trash2, Phone, Brain, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types/agent";
import AgentDetailsDialog from "./AgentDetailsDialog";
import VoiceTestDialog from "./VoiceTestDialog";

interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
  onUpdate: (agent: Agent) => void;
}

const AgentCard = ({ agent, onDelete, onUpdate }: AgentCardProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVoiceTestOpen, setIsVoiceTestOpen] = useState(false);

  const handleToggleStatus = () => {
    onUpdate({
      ...agent,
      status: agent.status === "active" ? "inactive" : "active"
    });
  };

  return (
    <>
      <Card className="bg-gray-800/60 border-gray-700 hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02] group">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-gray-400">{agent.description}</p>
              </div>
            </div>
            <Badge 
              variant={agent.status === "active" ? "default" : "secondary"}
              className={agent.status === "active" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {agent.status}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">{agent.totalCalls}</div>
              <div className="text-xs text-gray-400">Calls</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-400">{agent.avgDuration}</div>
              <div className="text-xs text-gray-400">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">{agent.successRate}%</div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
          </div>

          {/* Voice Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Voice: {agent.voice}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{agent.knowledgeBase.length} docs</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className={`flex-1 ${
                agent.status === "active" 
                  ? "border-red-600 text-red-400 hover:bg-red-600/10" 
                  : "border-green-600 text-green-400 hover:bg-green-600/10"
              }`}
            >
              {agent.status === "active" ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {agent.status === "active" ? "Pause" : "Activate"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVoiceTestOpen(true)}
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <Phone className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDetailsOpen(true)}
              className="border-gray-600 text-gray-400 hover:bg-gray-600/10"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(agent.id)}
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <AgentDetailsDialog
        agent={agent}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={onUpdate}
      />

      <VoiceTestDialog
        agent={agent}
        isOpen={isVoiceTestOpen}
        onClose={() => setIsVoiceTestOpen(false)}
      />
    </>
  );
};

export default AgentCard;
