import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserList } from "@/components/users/user-list"
import { BotList } from "@/components/users/bot-list"
import { mockUsers, mockBots } from "@/lib/mock-data"

export function UsersPage() {
  const [users, setUsers] = React.useState(mockUsers)
  const [bots, setBots] = React.useState(mockBots)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage human users and AI bots in your system
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="bots">
            AI Bots ({bots.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserList
            users={users}
            onUsersChange={setUsers}
          />
        </TabsContent>

        <TabsContent value="bots">
          <BotList
            bots={bots}
            onBotsChange={setBots}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}