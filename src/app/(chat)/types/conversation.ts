export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Provider {
  id: string
  name: string
  display_name: string
  api_base_url: string
  created_at: string
  updated_at: string
}

export interface Model {
  id: string
  provider_id: string
  name: string
  display_name: string
  input_token_cost: number
  output_token_cost: number
  context_window: number
  max_output_tokens: number
  is_active: boolean
  created_at: string
  updated_at: string
  provider?: Provider
}

export interface Conversation {
  id: string
  user_id: string
  model_id: string
  title: string
  system_prompt?: string
  temperature: number
  max_tokens?: number
  is_active: boolean
  created_at: string
  updated_at: string
  model?: Model
  message_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  parent_id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  input_tokens?: number
  output_tokens?: number
  input_cost?: number
  output_cost?: number
  created_at: string
  updated_at: string
  artifacts?: Artifact[]
  tools?: MessageTool[]
}

export interface Artifact {
  id: string
  message_id: string
  type: string
  title: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Tool {
  id: string
  name: string
  display_name: string
  description: string
  parameters_schema: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MessageTool {
  id: string
  message_id: string
  tool_id: string
  input: Record<string, unknown>
  output?: Record<string, unknown>
  execution_status: 'pending' | 'running' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  updated_at: string
  tool?: Tool
}

// API Request/Response types
export interface CreateConversationRequest {
  title: string
  model_name?: string // Use the "provider/model" format from backend
  system_prompt?: string
  temperature?: number
  max_tokens?: number
}

export interface PostMessageRequest {
  content: string
  parent_id?: string
  model_id?: string
}

export interface ConversationSummaryResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
  model: {
    id: string
    name: string
    display_name: string
    provider?: {
      id: string
      name: string
      display_name: string
    }
  }
}

export interface ConversationDetailResponse {
  id: string
  user_id: string
  model_id: string
  title: string
  system_prompt?: string
  temperature: number
  max_tokens?: number
  is_active: boolean
  created_at: string
  updated_at: string
  model: Model
  messages: Message[]
}

export interface StreamEvent {
  type: 'message_start' | 'content_delta' | 'message_end' | 'error'
  data?: unknown
  error?: string
}
