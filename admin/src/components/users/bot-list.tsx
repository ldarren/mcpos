import * as React from "react"
import { Plus, Search, Edit, Trash2, Bot as BotIcon, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddBotDialog } from "./add-bot-dialog"
import { cn } from "@/lib/utils"
import type { Bot } from "@/lib/mock-data"

interface BotListProps {
  bots: Bot[]
  onBotsChange: (bots: Bot[]) => void
}

function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`

  return formatDate(date)
}

function getStatusColor(status: Bot['status']): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-200'
    case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return apiKey
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
}

function BotRow({ bot, onEdit, onDelete }: {
  bot: Bot
  onEdit: (bot: Bot) => void
  onDelete: (botId: string) => void
}) {
  return (
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {bot.avatar || <BotIcon className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-medium flex items-center gap-2">
              {bot.name}
              <BotIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">{bot.modelId}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">{new URL(bot.url).hostname}</div>
          <div className="text-xs text-muted-foreground">{maskApiKey(bot.apiKey)}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{bot.temperature}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          getStatusColor(bot.status)
        )}>
          {bot.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">{bot.totalConversations.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">conversations</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatTimeAgo(bot.lastUsed)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(bot)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(bot.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function BotList({ bots, onBotsChange }: BotListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingBot, setEditingBot] = React.useState<Bot | null>(null)

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.modelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddBot = (newBot: Omit<Bot, 'id' | 'createdDate' | 'lastUsed' | 'totalConversations'>) => {
    const bot: Bot = {
      ...newBot,
      id: `bot-${Date.now()}`,
      createdDate: new Date(),
      lastUsed: new Date(),
      totalConversations: 0
    }
    onBotsChange([...bots, bot])
  }

  const handleEditBot = (botData: Bot | Omit<Bot, 'id' | 'createdDate' | 'lastUsed' | 'totalConversations'>) => {
    if ('id' in botData) {
      // This is an edit operation
      onBotsChange(bots.map(bot =>
        bot.id === botData.id ? botData : bot
      ))
      setEditingBot(null)
    } else {
      // This shouldn't happen for edit, but handle gracefully
      console.error('Edit operation received data without ID')
    }
  }

  const handleDeleteBot = (botId: string) => {
    if (confirm("Are you sure you want to delete this bot?")) {
      onBotsChange(bots.filter(bot => bot.id !== botId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search bots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-80"
            />
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add AI Bot
        </Button>
      </div>

      {/* Bots Table */}
      <div className="border rounded-lg bg-card">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Bot
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                API Endpoint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Temperature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBots.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  {searchQuery ? "No bots match your search" : "No AI bots yet"}
                </td>
              </tr>
            ) : (
              filteredBots.map((bot) => (
                <BotRow
                  key={bot.id}
                  bot={bot}
                  onEdit={setEditingBot}
                  onDelete={handleDeleteBot}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Bot Dialog */}
      <AddBotDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddBot={handleAddBot}
      />

      {/* Edit Bot Dialog */}
      {editingBot && (
        <AddBotDialog
          open={!!editingBot}
          onOpenChange={(open) => !open && setEditingBot(null)}
          onAddBot={handleEditBot}
          editingBot={editingBot}
        />
      )}
    </div>
  )
}