import * as React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Footer } from "./footer"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  currentPath?: string
  className?: string
}

export function MainLayout({
  children,
  title,
  currentPath,
  className
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar currentPath={currentPath} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header title={title} />

        {/* Content */}
        <main className={cn(
          "flex-1 overflow-auto p-6",
          className
        )}>
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}