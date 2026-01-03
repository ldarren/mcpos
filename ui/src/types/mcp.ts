import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface MCPServer {
  id: string
  name: string
  domain: string
  status: 'connected' | 'disconnected' | 'connecting'
  tools?: Tool[]
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum'
  required: boolean
  description?: string
  enum?: string[]
  minimum?: number
  maximum?: number
}

export interface ToolExecution {
  toolName: string
  serverId: string
  parameters: Record<string, any>
  output?: string
  isStreaming?: boolean
  status: 'running' | 'completed' | 'error'
}