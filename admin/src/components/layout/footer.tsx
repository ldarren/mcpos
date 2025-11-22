import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn(
      "flex h-12 items-center justify-between border-t bg-background px-6 text-sm text-muted-foreground",
      className
    )}>
      <p>&copy; 2025 MCPOS Admin Dashboard. All rights reserved.</p>
      <div className="flex items-center space-x-4">
        <span>Version 1.0.0</span>
        <span>•</span>
        <a href="#" className="hover:text-foreground transition-colors">
          Help
        </a>
        <span>•</span>
        <a href="#" className="hover:text-foreground transition-colors">
          Privacy
        </a>
      </div>
    </footer>
  )
}