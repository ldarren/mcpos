import * as React from "react"
import { Search, MoreVertical, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateChatDialog } from "./create-chat-dialog"
import { cn } from "@/lib/utils"
import type { Chat } from "@/lib/mock-data"

interface ChatListProps {
  chats: Chat[]
  selectedChatId: string | null
  onChatSelect: (chatId: string) => void
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`

  return date.toLocaleDateString()
}

function ChatItem({ chat, isSelected, onClick }: {
  chat: Chat
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b border-border/40",
        isSelected && "bg-muted"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
          {chat.avatar}
        </div>
        {chat.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn(
            "font-medium truncate",
            chat.unreadCount > 0 && "font-semibold"
          )}>
            {chat.name}
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(chat.timestamp)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm text-muted-foreground truncate",
            chat.unreadCount > 0 && "text-foreground font-medium"
          )}>
            {chat.lastMessage}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0 ml-2">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChatList({ chats, selectedChatId, onChatSelect }: ChatListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateChatOpen, setIsCreateChatOpen] = React.useState(false)

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        {/* Search with Options Menu */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsCreateChatOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No conversations match your search" : "No conversations yet"}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              onClick={() => onChatSelect(chat.id)}
            />
          ))
        )}
      </div>

      {/* Create Chat Dialog */}
      <CreateChatDialog
        open={isCreateChatOpen}
        onOpenChange={setIsCreateChatOpen}
        onCreateChat={(newChat) => {
          // TODO: Handle new chat creation
          console.log("Creating new chat:", newChat)
          setIsCreateChatOpen(false)
        }}
      />
    </div>
  )
}