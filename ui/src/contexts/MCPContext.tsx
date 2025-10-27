import { createContext, useContext, useReducer, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { MCPServer, MCPTool } from '../types/mcp'
import { mcpClient } from '../services/mcpClient'

interface MCPState {
  servers: MCPServer[]
  notifications: { serverId: string; message: any; timestamp: number }[]
  progress: { serverId: string; data: any; timestamp: number }[]
}

type MCPAction =
  | { type: 'ADD_SERVER'; payload: MCPServer }
  | { type: 'UPDATE_SERVER'; payload: { id: string; updates: Partial<MCPServer> } }
  | { type: 'REMOVE_SERVER'; payload: string }
  | { type: 'SET_SERVER_STATUS'; payload: { id: string; status: MCPServer['status'] } }
  | { type: 'SET_SERVER_TOOLS'; payload: { id: string; tools: MCPTool[] } }
  | { type: 'ADD_NOTIFICATION'; payload: { serverId: string; message: any } }
  | { type: 'ADD_PROGRESS'; payload: { serverId: string; data: any } }
  | { type: 'CLEAR_NOTIFICATIONS'; payload?: string }

const initialState: MCPState = {
  servers: [
    {
      id: '1',
      name: 'Countdown Server',
      domain: 'localhost:6001',
      status: 'disconnected'
    }
  ],
  notifications: [],
  progress: []
}

function mcpReducer(state: MCPState, action: MCPAction): MCPState {
  switch (action.type) {
    case 'ADD_SERVER':
      return {
        ...state,
        servers: [...state.servers, action.payload]
      }

    case 'UPDATE_SERVER':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload.id
            ? { ...server, ...action.payload.updates }
            : server
        )
      }

    case 'REMOVE_SERVER':
      return {
        ...state,
        servers: state.servers.filter(server => server.id !== action.payload)
      }

    case 'SET_SERVER_STATUS':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload.id
            ? { ...server, status: action.payload.status }
            : server
        )
      }

    case 'SET_SERVER_TOOLS':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload.id
            ? { ...server, tools: action.payload.tools }
            : server
        )
      }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            serverId: action.payload.serverId,
            message: action.payload.message,
            timestamp: Date.now()
          }
        ].slice(-50) // Keep only last 50 notifications
      }

    case 'ADD_PROGRESS':
      return {
        ...state,
        progress: [
          ...state.progress,
          {
            serverId: action.payload.serverId,
            data: action.payload.data,
            timestamp: Date.now()
          }
        ].slice(-50) // Keep only last 50 progress updates
      }

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload
          ? state.notifications.filter(n => n.serverId !== action.payload)
          : []
      }

    default:
      return state
  }
}

interface MCPContextType {
  state: MCPState
  actions: {
    addServer: (server: Omit<MCPServer, 'id'>) => Promise<void>
    removeServer: (id: string) => Promise<void>
    connectToServer: (id: string) => Promise<boolean>
    disconnectFromServer: (id: string) => Promise<void>
    fetchServerTools: (id: string) => Promise<void>
    callTool: (serverId: string, toolName: string, args: Record<string, any>) => Promise<any>
    clearNotifications: (serverId?: string) => void
  }
}

const MCPContext = createContext<MCPContextType | undefined>(undefined)

export function MCPProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mcpReducer, initialState)

  useEffect(() => {
    // Set up global notification listeners
    const unsubscribeNotification = mcpClient.onNotification((serverId, notification) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { serverId, message: notification } })
    })

    const unsubscribeProgress = mcpClient.onProgress((serverId, progress) => {
      dispatch({ type: 'ADD_PROGRESS', payload: { serverId, data: progress } })
    })

    return () => {
      unsubscribeNotification()
      unsubscribeProgress()
    }
  }, [])

  const actions = {
    addServer: async (serverData: Omit<MCPServer, 'id'>) => {
      const newServer: MCPServer = {
        ...serverData,
        id: Date.now().toString(),
        status: 'disconnected'
      }
      dispatch({ type: 'ADD_SERVER', payload: newServer })
    },

    removeServer: async (id: string) => {
      await mcpClient.disconnectFromServer(id)
      dispatch({ type: 'REMOVE_SERVER', payload: id })
    },

    connectToServer: async (id: string): Promise<boolean> => {
      const server = state.servers.find(s => s.id === id)
      if (!server) return false

      dispatch({ type: 'SET_SERVER_STATUS', payload: { id, status: 'connecting' } })

      try {
        const connected = await mcpClient.connectToServer(server)
        if (connected) {
          dispatch({ type: 'SET_SERVER_STATUS', payload: { id, status: 'connected' } })
          await actions.fetchServerTools(id)
        } else {
          dispatch({ type: 'SET_SERVER_STATUS', payload: { id, status: 'disconnected' } })
        }
        return connected
      } catch (error) {
        dispatch({ type: 'SET_SERVER_STATUS', payload: { id, status: 'disconnected' } })
        throw error
      }
    },

    disconnectFromServer: async (id: string) => {
      await mcpClient.disconnectFromServer(id)
      dispatch({ type: 'SET_SERVER_STATUS', payload: { id, status: 'disconnected' } })
      dispatch({ type: 'SET_SERVER_TOOLS', payload: { id, tools: [] } })
    },

    fetchServerTools: async (id: string) => {
      try {
        const tools = await mcpClient.listTools(id)
        dispatch({ type: 'SET_SERVER_TOOLS', payload: { id, tools } })
      } catch (error) {
        console.error('Failed to fetch server tools:', error)
        throw error
      }
    },

    callTool: async (serverId: string, toolName: string, args: Record<string, any>) => {
      return await mcpClient.callTool(serverId, toolName, args)
    },

    clearNotifications: (serverId?: string) => {
      dispatch({ type: 'CLEAR_NOTIFICATIONS', payload: serverId })
    }
  }

  return (
    <MCPContext.Provider value={{ state, actions }}>
      {children}
    </MCPContext.Provider>
  )
}

export function useMCP() {
  const context = useContext(MCPContext)
  if (context === undefined) {
    throw new Error('useMCP must be used within an MCPProvider')
  }
  return context
}