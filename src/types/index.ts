export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export type ViewMode =
  | 'chat'
  | 'image'
  | 'writing'
  | 'code'
  | 'study'
  | 'translate'
  | 'summary'
  | 'api_docs';

export interface ToolConfig {
  id: ViewMode;
  icon: string;
  name: string;
  description: string;
  placeholder: string;
  actionText: string;
}

export interface ApiStatusData {
  status: string;
  service: string;
  version: string;
  model: string;
  hasApiKey: boolean;
  uptimeSeconds: number;
  supportedTools: string[];
}
