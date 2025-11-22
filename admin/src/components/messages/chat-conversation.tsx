import * as React from "react"
import { MoreVertical, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInput } from "./chat-input"
import { cn } from "@/lib/utils"
import type { Chat, Message } from "@/lib/mock-data"

interface ChatConversationProps {
  chat: Chat
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={cn(
      "flex mb-4",
      message.isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] px-4 py-2 rounded-lg",
        message.isOwn
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-muted rounded-bl-sm"
      )}>
        {!message.isOwn && (
          <p className="text-xs font-medium mb-1 opacity-70">
            {message.senderName}
          </p>
        )}
        <p className="text-sm">{message.content}</p>
        <p className={cn(
          "text-xs mt-1",
          message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatMessageTime(message.timestamp)}
        </p>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {chat.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
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