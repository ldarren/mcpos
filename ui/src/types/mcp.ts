import {type McpUiAppToolConfig} from '@modelcontextprotocol/ext-apps/server'
export interface MCPServer {
  id: string
  name: string
  domain: string
  status: 'connected' | 'disconnected' | 'connecting'
  tools?: MCPTool[]
}

export interface MCPTool {
  name: string
  description?: string
  inputSchema: any
  _meta?: McpUiAppToolConfig['_meta']
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