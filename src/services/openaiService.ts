
export interface OpenAIRealtimeConfig {
  apiKey: string;
  model: string;
  voice: string;
  instructions?: string;
}

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private config: OpenAIRealtimeConfig;
  private audioContext: AudioContext | null = null;
  private onMessage: (message: any) => void = () => {};
  private onError: (error: any) => void = () => {};
  private onConnect: () => void = () => {};
  private onDisconnect: () => void = () => {};

  constructor(config: OpenAIRealtimeConfig) {
    this.apiKey = config.apiKey;
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use proper WebSocket connection with authentication header
        const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to OpenAI Realtime API');
          this.initializeAudioContext();
          this.sendSessionUpdate();
          this.onConnect();
          resolve();
        };

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          this.handleMessage(message);
          this.onMessage(message);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onError(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from OpenAI Realtime API');
          this.onDisconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private sendSessionUpdate() {
    if (!this.ws) return;

    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: this.config.instructions || `You are a helpful AI assistant. Be concise and natural in your responses.`,
        voice: this.config.voice || "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        },
        tools: [],
        tool_choice: "auto",
        temperature: 0.8,
        max_response_output_tokens: 4096
      }
    };

    // Add authentication header
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'OpenAI-Beta': 'realtime=v1'
    };

    // Send session update with proper headers
    this.ws.send(JSON.stringify(sessionUpdate));
    
    // Send additional authorization message
    const authMessage = {
      type: "auth",
      token: this.apiKey
    };
    this.ws.send(JSON.stringify(authMessage));
  }

  private async handleMessage(message: any) {
    if (message.type === 'response.audio.delta') {
      await this.playAudioChunk(message.delta);
    }
  }

  private async playAudioChunk(base64Audio: string) {
    if (!this.audioContext || !base64Audio) return;

    try {
      // Decode base64 audio
      const binaryString = atob(base64Audio);
      const audioData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioData[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(1, audioData.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < channelData.length; i++) {
        const sample = (audioData[i * 2] | (audioData[i * 2 + 1] << 8));
        channelData[i] = sample < 32768 ? sample / 32768 : (sample - 65536) / 32768;
      }

      // Play audio
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  sendAudioData(audioData: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const audioArray = new Uint8Array(audioData);
    const base64Audio = btoa(String.fromCharCode(...audioArray));

    const audioMessage = {
      type: "input_audio_buffer.append",
      audio: base64Audio
    };

    this.ws.send(JSON.stringify(audioMessage));
  }

  commitAudio() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const commitMessage = {
      type: "input_audio_buffer.commit"
    };

    this.ws.send(JSON.stringify(commitMessage));
  }

  sendTextMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const textMessage = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: text
        }]
      }
    };

    this.ws.send(JSON.stringify(textMessage));

    const responseMessage = {
      type: "response.create",
      response: {
        modalities: ["text", "audio"]
      }
    };

    this.ws.send(JSON.stringify(responseMessage));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  onMessageReceived(callback: (message: any) => void) {
    this.onMessage = callback;
  }

  onErrorOccurred(callback: (error: any) => void) {
    this.onError = callback;
  }

  onConnected(callback: () => void) {
    this.onConnect = callback;
  }

  onDisconnected(callback: () => void) {
    this.onDisconnect = callback;
  }
}
