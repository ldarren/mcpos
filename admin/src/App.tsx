import { Routes, Route, useLocation } from 'react-router-dom'
import { MainLayout } from '@/components/layout/main-layout'
import { Toaster } from '@/components/ui/toaster'
import { DashboardPage } from '@/pages/dashboard'
import { MessagesPage } from '@/pages/messages'
import { UsersPage } from '@/pages/users'

function App() {
  const location = useLocation()

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': return 'Dashboard'
      case '/messages': return 'Messages'
      case '/users': return 'Users'
      case '/analytics': return 'Analytics'
      case '/documents': return 'Documents'
      case '/database': return 'Database'
      case '/settings': return 'Settings'
      default: return 'Admin'
    }
  }

  return (
    <MainLayout title={getPageTitle(location.pathname)} currentPath={location.pathname}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/analytics" element={<div>Analytics page - Coming soon</div>} />
        <Route path="/documents" element={<div>Documents page - Coming soon</div>} />
        <Route path="/database" element={<div>Database page - Coming soon</div>} />
        <Route path="/settings" element={<div>Settings page - Coming soon</div>} />
      </Routes>
      <Toaster />
    </MainLayout>
  )
}

export default App
