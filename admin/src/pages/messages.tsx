import * as React from "react"
import { ChatList } from "@/components/messages/chat-list"
import { ChatConversation } from "@/components/messages/chat-conversation"
import { mockChats } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const MIN_WIDTH = 200
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 320

export function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null)
  const [listWidth, setListWidth] = React.useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = React.useState(false)
  const startXRef = React.useRef(0)
  const startWidthRef = React.useRef(DEFAULT_WIDTH)

  const selectedChat = selectedChatId ? mockChats.find(chat => chat.id === selectedChatId) : null

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startXRef.current = e.clientX
    startWidthRef.current = listWidth
    setIsResizing(true)
  }, [listWidth])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const delta = e.clientX - startXRef.current
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta))
      setListWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  return (
    <div className="flex h-[calc(100%+3rem)] -m-6">
      {/* Left Pane - Chat List */}
      <div
        className="border-r bg-background flex-shrink-0"
        style={{ width: listWidth }}
      >
        <ChatList
          chats={mockChats}
          selectedChatId={selectedChatId}
          onChatSelect={setSelectedChatId}
        />
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors flex-shrink-0",
          isResizing && "bg-primary/30"
        )}
      />

      {/* Right Pane - Chat Conversation */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {selectedChat ? (
          <ChatConversation chat={selectedChat} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No chat selected</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}