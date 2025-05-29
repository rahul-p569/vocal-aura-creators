
export interface Agent {
  id: string;
  name: string;
  description: string;
  voice: string;
  status: "active" | "inactive";
  totalCalls: number;
  avgDuration: string;
  successRate: number;
  knowledgeBase: string[];
  createdAt: Date;
  prompt?: string;
  telephonyIntegration?: {
    provider: "plivo" | "twilio";
    phoneNumber?: string;
  };
}

export interface VoiceOption {
  id: string;
  name: string;
  preview?: string;
}
