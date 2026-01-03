import { type Tool } from "@modelcontextprotocol/sdk/types.js"
import { useState } from 'react'
import {
  Modal,
  Stack,
  Text,
  Card,
  Button,
  Group,
  Badge,
  Loader,
  Alert
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconTool, IconInfoCircle } from '@tabler/icons-react'
import type { MCPServer } from '../types/mcp'
import { ToolWindow } from './ToolWindow'
import { useMCP } from '../contexts/MCPContext'

interface ToolsModalProps {
  opened: boolean
  onClose: () => void
  server: MCPServer | null
}

export function ToolsModal({ opened, onClose, server }: ToolsModalProps) {
  const { state } = useMCP()
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [toolWindowOpened, { open: openToolWindow, close: closeToolWindow }] = useDisclosure(false)

  // Get tools from the current server state
  const currentServer = server ? state.servers.find(s => s.id === server.id) : null
  const tools = currentServer?.tools || []
  const loading = currentServer?.status === 'connecting'
  const error = currentServer?.status === 'disconnected' ? 'Server not connected' : null

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool)
    openToolWindow()
  }

  const handleToolWindowClose = () => {
    closeToolWindow()
    setSelectedTool(null)
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={server ? `Tools - ${server.name}` : 'Tools'}
        size="lg"
        centered
        withinPortal
      >
        <Stack gap="md">
          {loading && (
            <Group justify="center" py="xl">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Loading tools...</Text>
            </Group>
          )}

          {error && (
            <Alert icon={<IconInfoCircle size={16} />} color="red">
              {error}
            </Alert>
          )}

          {!loading && !error && tools.length === 0 && (
            <Text ta="center" c="dimmed" py="xl">
              No tools available
            </Text>
          )}

          {!loading && !error && tools.length > 0 && (
            <Stack gap="sm">
              {tools.map((tool) => (
                <Card key={tool.name} withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Group gap="sm">
                        <IconTool size={16} />
                        <Text fw={500}>{tool.name}</Text>
                        <Badge size="sm" variant="light">Tool</Badge>
                      </Group>
                      {tool.description && (
                        <Text size="sm" c="dimmed">
                          {tool.description}
                        </Text>
                      )}
                    </Stack>
                    <Button
                      size="sm"
                      onClick={() => handleToolSelect(tool)}
                    >
                      Open
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Modal>

      {/* Tool Window */}
      <ToolWindow
        opened={toolWindowOpened}
        onClose={handleToolWindowClose}
        tool={selectedTool}
        server={server}
      />
    </>
  )
}