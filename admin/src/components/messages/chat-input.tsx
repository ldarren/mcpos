import * as React from "react"
import { Send, Paperclip, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      {/* Attachment Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="flex-shrink-0"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Message Input Container */}
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          className="w-full min-h-[40px] max-h-32 px-4 py-2 pr-12 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={1}
          style={{
            height: "auto",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = "auto"
            target.style.height = Math.min(target.scrollHeight, 128) + "px"
          }}
        />

        {/* Emoji Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </div>

      {/* Send Button */}
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || disabled}
        className="flex-shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}