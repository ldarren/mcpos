import * as React from "react"
import { Link } from "react-router-dom"
import {
  Menu,
  Home,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const sidebarItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/" },
  { id: "users", label: "Users", icon: Users, href: "/users" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
  { id: "messages", label: "Messages", icon: MessageSquare, href: "/messages" },
  { id: "documents", label: "Documents", icon: FileText, href: "/documents" },
  { id: "database", label: "Database", icon: Database, href: "/database" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
]

interface SidebarProps {
  currentPath?: string
  className?: string
}

// Create a context to manage sidebar state
const SidebarContext = React.createContext<{
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}>({
  isExpanded: false,
  setIsExpanded: () => { }
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

interface SidebarContentProps extends SidebarProps {
  variant: "hidden" | "minimal" | "full"
  onItemClick?: () => void
  showToggle?: boolean
}

function SidebarContent({ variant, currentPath = "/", onItemClick, showToggle = false }: SidebarContentProps) {
  const { isExpanded, setIsExpanded } = useSidebar()
  return (
    <nav className="flex flex-col h-full">
      <div className="h-16 px-4 border-b flex items-center">
        <div className="flex items-center justify-between w-full">
          <h2 className={cn(
            "font-bold text-xl",
            variant === "minimal" && "sr-only"
          )}>
            MCPOS
          </h2>

          {/* Toggle Button - only show on desktop minimal variant */}
          {showToggle && variant === "minimal" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          )}

          {/* Collapse Button - only show when expanded */}
          {showToggle && variant === "full" && isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.href

          const button = (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                variant === "minimal" && "px-2",
                variant === "full" && "px-4"
              )}
              asChild
            >
              <Link to={item.href} onClick={onItemClick}>
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  variant === "minimal" && "mx-auto"
                )} />
                <span className={cn(
                  variant === "minimal" && "sr-only"
                )}>
                  {item.label}
                </span>
              </Link>
            </Button>
          )

          // Only show tooltip in minimal mode where labels are hidden
          if (variant === "minimal") {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return button
        })}
      </div>
    </nav>
  )
}

export function Sidebar({ currentPath, className }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  // Load saved preference from localStorage, default to false
  const [isExpanded, setIsExpandedState] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-expanded')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  // Wrapper to save to localStorage when state changes
  const setIsExpanded = React.useCallback((expanded: boolean) => {
    setIsExpandedState(expanded)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-expanded', JSON.stringify(expanded))
    }
  }, [])

  // Determine the actual variant based on expanded state and screen size
  const getDesktopVariant = () => {
    // On very large screens (2048px+), always show full unless manually collapsed
    // On medium screens, show expanded if user clicked expand, otherwise minimal
    return isExpanded ? "full" : "minimal"
  }

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      <TooltipProvider>
        {/* Mobile burger menu - visible only on small screens */}
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden fixed top-4 left-4 z-50"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent
              variant="full"
              currentPath={currentPath}
              onItemClick={() => setIsMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar - hidden on mobile, expandable on medium+ screens */}
        <aside className={cn(
          "hidden sm:flex flex-col border-r bg-background transition-all duration-300",
          isExpanded ? "w-64" : "w-16", // Dynamic width based on expanded state
          className
        )}>
          <SidebarContent
            variant={getDesktopVariant()}
            currentPath={currentPath}
            showToggle={true}
          />
        </aside>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}