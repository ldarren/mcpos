import * as React from "react"
import { MoreVertical, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInput } from "./chat-input"
import { cn } from "@/lib/utils"
import { useChatSettings } from "@/contexts/chat-settings-context"
import type { Chat, Message } from "@/lib/mock-data"

interface ChatConversationProps {
  chat: Chat
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const { getRowColors } = useChatSettings()
  const rowColors = getRowColors()
  const isEvenRow = index % 2 === 0

  return (
    <div className={cn(
      "w-full px-4 py-3 mb-1",
      isEvenRow ? rowColors.evenRow : rowColors.oddRow
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">
            {message.senderName}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatMessageTime(message.timestamp)}
        </p>
      </div>
      <div className="mt-1">
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  )
}

export function ChatConversation({ chat }: ChatConversationProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [chat.messages])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
              {chat.avatar}
            </div>
            {chat.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>

          {/* Name and Status */}
          <div>
            <h3 className="font-medium">{chat.name}</h3>
            <p className="text-xs text-muted-foreground">
              {chat.isOnline ? "Active now" : "Last seen recently"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-0">
        {chat.messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t bg-background p-4">
        <ChatInput
          onSendMessage={(content) => {
            // TODO: Add message to chat
            console.log("Sending message:", content)
          }}
        />
      </div>
    </div>
  )
}