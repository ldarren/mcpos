import * as React from "react"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddUserDialog } from "./add-user-dialog"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/mock-data"

interface UserListProps {
  users: User[]
  onUsersChange: (users: User[]) => void
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

function getRoleColor(role: User['role']): string {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-700 border-red-200'
    case 'moderator': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'user': return 'bg-gray-100 text-gray-700 border-gray-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getStatusColor(status: User['status']): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-200'
    case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function UserRow({ user, onEdit, onDelete }: {
  user: User
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}) {
  return (
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {user.avatar}
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          getRoleColor(user.role)
        )}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          getStatusColor(user.status)
        )}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatDate(user.joinDate)}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        {formatTimeAgo(user.lastActive)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(user.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function UserList({ users, onUsersChange }: UserListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: `user-${Date.now()}`
    }
    onUsersChange([...users, user])
  }

  const handleEditUser = (userData: User | Omit<User, 'id'>) => {
    if ('id' in userData) {
      // This is an edit operation
      onUsersChange(users.map(user =>
        user.id === userData.id ? userData : user
      ))
      setEditingUser(null)
    } else {
      // This shouldn't happen for edit, but handle gracefully
      console.error('Edit operation received data without ID')
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      onUsersChange(users.filter(user => user.id !== userId))
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-80"
            />
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg bg-card">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Join Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  {searchQuery ? "No users match your search" : "No users yet"}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={setEditingUser}
                  onDelete={handleDeleteUser}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddUser={handleAddUser}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <AddUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onAddUser={handleEditUser}
          editingUser={editingUser}
        />
      )}
    </div>
  )
}