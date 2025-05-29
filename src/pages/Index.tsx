
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import AgentCard from "@/components/AgentCard";
import CreateAgentDialog from "@/components/CreateAgentDialog";
import SettingsDialog from "@/components/SettingsDialog";
import { Agent } from "@/types/agent";

const Index = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "1",
      name: "Sales Assistant",
      description: "Handles customer inquiries and sales calls",
      voice: "alloy",
      status: "active",
      totalCalls: 142,
      avgDuration: "3m 45s",
      successRate: 89,
      knowledgeBase: ["sales-training.pdf", "product-catalog.pdf"],
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "Support Agent",
      description: "Technical support and troubleshooting",
      voice: "echo",
      status: "inactive",
      totalCalls: 67,
      avgDuration: "5m 12s",
      successRate: 94,
      knowledgeBase: ["support-docs.pdf", "faq.pdf"],
      createdAt: new Date("2024-01-20"),
    },
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCreateAgent = (agentData: Omit<Agent, "id" | "totalCalls" | "avgDuration" | "successRate" | "createdAt">) => {
    const newAgent: Agent = {
      ...agentData,
      id: Date.now().toString(),
      totalCalls: 0,
      avgDuration: "0m 0s",
      successRate: 0,
      createdAt: new Date(),
    };
    setAgents(prev => [...prev, newAgent]);
    setIsCreateDialogOpen(false);
  };

  const handleDeleteAgent = (id: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(prev => prev.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Voice Agents Platform
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create, train, and deploy intelligent voice agents with advanced AI capabilities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{agents.length}</div>
              <div className="text-gray-400">Total Agents</div>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {agents.filter(a => a.status === "active").length}
              </div>
              <div className="text-gray-400">Active Agents</div>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {agents.reduce((sum, agent) => sum + agent.totalCalls, 0)}
              </div>
              <div className="text-gray-400">Total Calls</div>
            </div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">
                {Math.round(agents.reduce((sum, agent) => sum + agent.successRate, 0) / agents.length)}%
              </div>
              <div className="text-gray-400">Avg Success Rate</div>
            </div>
          </Card>
        </div>

        {/* Agents Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Voice Agents</h2>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {agents.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700 p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">No agents yet</h3>
              <p className="text-gray-400 mb-6">Create your first voice agent to get started</p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDeleteAgent}
                onUpdate={handleUpdateAgent}
              />
            ))}
          </div>
        )}
      </main>

      <CreateAgentDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateAgent={handleCreateAgent}
      />

      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Index;
