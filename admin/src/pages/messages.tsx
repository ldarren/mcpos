import * as React from "react"
import { ChatList } from "@/components/messages/chat-list"
import { ChatConversation } from "@/components/messages/chat-conversation"
import { mockChats } from "@/lib/mock-data"

export function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null)

  const selectedChat = selectedChatId ? mockChats.find(chat => chat.id === selectedChatId) : null

  return (
    <div className="flex h-full -m-6">
      {/* Left Pane - Chat List */}
      <div className="w-80 border-r bg-background">
        <ChatList
          chats={mockChats}
          selectedChatId={selectedChatId}
          onChatSelect={setSelectedChatId}
        />
      </div>

      {/* Right Pane - Chat Conversation */}
      <div className="flex-1 flex flex-col">
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