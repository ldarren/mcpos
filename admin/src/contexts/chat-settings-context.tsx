import * as React from "react"

export type ChatTheme = "default" | "high-contrast" | "subtle" | "custom"

export interface ChatRowColors {
  evenRow: string
  oddRow: string
}

export interface ChatSettings {
  theme: ChatTheme
  customColors: ChatRowColors
}

export interface ChatSettingsContextType {
  settings: ChatSettings
  updateSettings: (newSettings: Partial<ChatSettings>) => void
  getRowColors: () => ChatRowColors
}

const defaultSettings: ChatSettings = {
  theme: "default",
  customColors: {
    evenRow: "bg-muted/50",
    oddRow: "bg-background"
  }
}

const themeColorSets: Record<ChatTheme, ChatRowColors> = {
  default: {
    evenRow: "bg-muted/50",
    oddRow: "bg-background"
  },
  "high-contrast": {
    evenRow: "bg-muted/80",
    oddRow: "bg-background"
  },
  subtle: {
    evenRow: "bg-muted/20",
    oddRow: "bg-background"
  },
  custom: {
    evenRow: "bg-muted/50",
    oddRow: "bg-background"
  }
}

const ChatSettingsContext = React.createContext<ChatSettingsContextType | null>(null)

export function ChatSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<ChatSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-settings')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return defaultSettings
        }
      }
    }
    return defaultSettings
  })

  const updateSettings = React.useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      if (typeof window !== 'undefined') {
        localStorage.setItem('chat-settings', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const getRowColors = React.useCallback((): ChatRowColors => {
    if (settings.theme === 'custom') {
      return settings.customColors
    }
    return themeColorSets[settings.theme]
  }, [settings.theme, settings.customColors])

  const contextValue: ChatSettingsContextType = {
    settings,
    updateSettings,
    getRowColors
  }

  return (
    <ChatSettingsContext.Provider value={contextValue}>
      {children}
    </ChatSettingsContext.Provider>
  )
}

export function useChatSettings() {
  const context = React.useContext(ChatSettingsContext)
  if (!context) {
    throw new Error('useChatSettings must be used within a ChatSettingsProvider')
  }
  return context
}