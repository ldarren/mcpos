import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, X, User as UserIcon, Bot as BotIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockUsers, mockBots } from "@/lib/mock-data"

interface CreateChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChat: (chatData: {
    name: string
    participants: Array<{ id: string; name: string; type: 'user' | 'bot' }>
  }) => void
}

type Participant = {
  id: string
  name: string
  type: 'user' | 'bot'
  avatar?: string
}

export function CreateChatDialog({ open, onOpenChange, onCreateChat }: CreateChatDialogProps) {
  const [chatName, setChatName] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedParticipants, setSelectedParticipants] = React.useState<Participant[]>([])

  // Combine users and bots into a single list
  const allParticipants: Participant[] = [
    ...mockUsers
      .filter(user => user.status === 'active')
      .map(user => ({
        id: user.id,
        name: user.name,
        type: 'user' as const,
        avatar: user.avatar
      })),
    ...mockBots
      .filter(bot => bot.status === 'active')
      .map(bot => ({
        id: bot.id,
        name: bot.name,
        type: 'bot' as const,
        avatar: bot.avatar
      }))
  ]

  const filteredParticipants = allParticipants.filter(participant =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedParticipants.find(selected => selected.id === participant.id)
  )

  const addParticipant = (participant: Participant) => {
    setSelectedParticipants(prev => [...prev, participant])
  }

  const removeParticipant = (participantId: string) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== participantId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatName.trim()) {
      return
    }

    if (selectedParticipants.length === 0) {
      return
    }

    onCreateChat({
      name: chatName,
      participants: selectedParticipants
    })

    // Reset form
    setChatName("")
    setSelectedParticipants([])
    setSearchQuery("")
  }

  React.useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setChatName("")
      setSelectedParticipants([])
      setSearchQuery("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
          {/* Chat Name Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Chat Name *
            </label>
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="Enter chat group name..."
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Selected Participants */}
          {selectedParticipants.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Selected Participants ({selectedParticipants.length})
              </label>
              <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-muted/20">
                {selectedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 px-2 py-1 bg-background rounded-md border text-sm"
                  >
                    <div className="flex items-center gap-1">
                      {participant.type === 'user' ? (
                        <UserIcon className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <BotIcon className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span>{participant.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParticipant(participant.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Participants */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-medium mb-2">
              Add Participants *
            </label>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search users and bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto border border-border rounded-lg">
              {filteredParticipants.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? "No users or bots match your search" : "All available participants are already selected"}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredParticipants.map((participant) => (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => addParticipant(participant)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {participant.avatar || (participant.type === 'user' ? <UserIcon className="h-4 w-4" /> : <BotIcon className="h-4 w-4" />)}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{participant.name}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 text-xs rounded-full",
                            participant.type === 'user'
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          )}>
                            {participant.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!chatName.trim() || selectedParticipants.length === 0}
            >
              Create Chat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}