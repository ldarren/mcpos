import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { LoggingMessageNotificationSchema, ProgressNotificationSchema } from "@modelcontextprotocol/sdk/types.js"
import type { MCPServer, MCPTool } from '../types/mcp'

export class MCPClientService {
  private clients: Map<string, { client: Client; transport: StreamableHTTPClientTransport }> = new Map()

  async connectToServer(server: MCPServer): Promise<boolean> {
    try {
      const client = new Client(
        {
          name: `mcp-client-for-${server.name}`,
          version: '1.0.0',
        },
      )
      const url = new URL(`http://${server.domain}/mcp`)

      const transport = new StreamableHTTPClientTransport(url)
      console.log('Transport created:', transport)
      await client.connect(transport)
      console.log('Connected to MCP server successfully')
      console.log('Session ID after connect:', (transport as any)._sessionId)

      this.setUpTransport(server.id, transport)

      // Set up notification handlers AFTER connection is established
      client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
        console.log('Notification received:', notification)
        // You can emit events here for UI components to listen to
        this.emitNotification(server.id, notification)
      })

      client.setNotificationHandler(ProgressNotificationSchema, (notification) => {
        console.log('Progress notification:', notification)
        this.emitProgress(server.id, notification)
      })

      this.clients.set(server.id, { client, transport })
      return true
    } catch (error) {
      console.error('Failed to connect to MCP server:', error)
      return false
    }
  }

  async disconnectFromServer(serverId: string): Promise<void> {
    const clientInfo = this.clients.get(serverId)
    if (clientInfo) {
      await clientInfo.client.close()
      this.clients.delete(serverId)
    }
  }

  async listTools(serverId: string): Promise<MCPTool[]> {
    const clientInfo = this.clients.get(serverId)
    if (!clientInfo) {
      throw new Error('Not connected to server')
    }

    try {
      const response = await clientInfo.client.listTools()

      return response.tools || []
    } catch (error) {
      console.error('Failed to list tools:', error)
      throw error
    }
  }

  async callTool(serverId: string, toolName: string, args: Record<string, any>): Promise<any> {
    const clientInfo = this.clients.get(serverId)
    if (!clientInfo) {
      throw new Error('Not connected to server')
    }

    try {
      const response = await clientInfo.client.callTool({
        name: toolName, arguments: args
      })

      return response
    } catch (error) {
      console.error('Failed to call tool:', error)
      throw error
    }
  }

  isConnected(serverId: string): boolean {
    return this.clients.has(serverId)
  }

  // Event emission methods - you can integrate with a state management system
  private emitNotification(serverId: string, notification: any) {
    const event = new CustomEvent('mcp-notification', {
      detail: { serverId, notification }
    })
    window.dispatchEvent(event)
  }

  private emitProgress(serverId: string, progress: any) {
    const event = new CustomEvent('mcp-progress', {
      detail: { serverId, progress }
    })
    window.dispatchEvent(event)
  }

  private setUpTransport(id: string, transport: StreamableHTTPClientTransport) {
    if (!transport) {
      return
    }
    transport.onclose = () => {
      console.log("SSE transport closed.")
    }

    transport.onerror = async (error) => {
      console.log("SSE transport error: ", error)
      await this.disconnectFromServer(id)
    }
  }

  // Listen to notifications
  onNotification(callback: (serverId: string, notification: any) => void) {
    const handler = (event: CustomEvent) => {
      callback(event.detail.serverId, event.detail.notification)
    }
    window.addEventListener('mcp-notification', handler as EventListener)
    return () => window.removeEventListener('mcp-notification', handler as EventListener)
  }

  onProgress(callback: (serverId: string, progress: any) => void) {
    const handler = (event: CustomEvent) => {
      callback(event.detail.serverId, event.detail.progress)
    }
    window.addEventListener('mcp-progress', handler as EventListener)
    return () => window.removeEventListener('mcp-progress', handler as EventListener)
  }
}

// Singleton instance
export const mcpClient = new MCPClientService()