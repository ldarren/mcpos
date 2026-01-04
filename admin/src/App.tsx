import { Routes, Route, useLocation } from 'react-router-dom'
import { MainLayout } from '@/components/layout/main-layout'
import { Toaster } from '@/components/ui/toaster'
import { ChatSettingsProvider } from '@/contexts/chat-settings-context'
import { DashboardPage } from '@/pages/dashboard'
import { MessagesPage } from '@/pages/messages'
import { UsersPage } from '@/pages/users'
import { SettingsPage } from '@/pages/settings'

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '': return 'Dashboard'
    case 'messages': return 'Messages'
    case 'users': return 'Users'
    case 'analytics': return 'Analytics'
    case 'documents': return 'Documents'
    case 'database': return 'Database'
    case 'settings': return 'Settings'
    default: return 'Admin'
  }
}

function App() {
  const pathname = useLocation().pathname
  const basename = pathname.split('/')[1]

  return (
    <ChatSettingsProvider>
      <MainLayout title={getPageTitle(basename)} currentPath={pathname}>
        <Routes>
          <Route path="" element={<DashboardPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="analytics" element={<div>Analytics page - Coming soon</div>} />
          <Route path="documents" element={<div>Documents page - Coming soon</div>} />
          <Route path="database" element={<div>Database page - Coming soon</div>} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
        <Toaster />
      </MainLayout>
    </ChatSettingsProvider>
  )
}

export default App
