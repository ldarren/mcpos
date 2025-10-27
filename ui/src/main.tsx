import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import App from './App.tsx'
import { MCPProvider } from './contexts/MCPContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <ModalsProvider>
        <Notifications />
        <MCPProvider>
          <App />
        </MCPProvider>
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>,
)
