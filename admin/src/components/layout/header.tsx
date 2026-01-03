import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title?: string
  className?: string
}

export function Header({ title = "Dashboard", className }: HeaderProps) {
  return (
    <header className={cn(
      "flex h-16 items-center justify-between border-b bg-background px-6",
      className
    )}>
      {/* Title Section */}
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>

      {/* Right Section - Search, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Profile */}
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">Profile</span>
        </Button>
      </div>
    </header>
  )
}