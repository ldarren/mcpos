import { useState } from 'react'
import { AppShell, Container, Title, Modal, TextInput, Stack, Group, Button } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { MCPServerTable } from './components/MCPServerTable'
import { ToolsModal } from './components/ToolsModal'
import { useMCP } from './contexts/MCPContext'
import type { MCPServer } from './types/mcp'

function App() {
  const { actions } = useMCP()
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false)
  const [toolsModalOpened, { open: openToolsModal, close: closeToolsModal }] = useDisclosure(false)

  const form = useForm({
    initialValues: {
      name: '',
      domain: ''
    },
    validate: {
      name: (value) => (value.length < 1 ? 'Name is required' : null),
      domain: (value) => (value.length < 1 ? 'Domain is required' : null)
    }
  })

  const handleAddServer = async (values: { name: string; domain: string }) => {
    try {
      const server: Omit<MCPServer, 'id'> = Object.assign({status: 'disconnected' as const}, values)
      await actions.addServer(server)
      form.reset()
      closeAddModal()
      notifications.show({
        title: 'Server Added',
        message: `${values.name} has been added successfully`,
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add server',
        color: 'red'
      })
    }
  }

  const handleOpenToolsModal = (server: MCPServer) => {
    setSelectedServer(server)
    openToolsModal()
  }

  const handleCloseToolsModal = () => {
    closeToolsModal()
    setSelectedServer(null)
  }

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%" style={{ display: 'flex', alignItems: 'center' }}>
          <Title order={2}>MCPOS Dashboard</Title>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <MCPServerTable
            onOpenAddModal={openAddModal}
            onOpenToolsModal={handleOpenToolsModal}
          />
        </Container>

        {/* Add Server Modal */}
        <Modal
          opened={addModalOpened}
          onClose={closeAddModal}
          title="Add MCP Server"
          centered
          withinPortal
        >
          <form onSubmit={form.onSubmit(handleAddServer)}>
            <Stack gap="md">
              <TextInput
                label="Server Name"
                placeholder="e.g., Countdown Server"
                {...form.getInputProps('name')}
              />
              <TextInput
                label="Domain"
                placeholder="e.g., localhost:6001"
                {...form.getInputProps('domain')}
              />
              <Group justify="flex-end" gap="sm">
                <Button variant="light" onClick={closeAddModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Server
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Tools Modal */}
        <ToolsModal
          opened={toolsModalOpened}
          onClose={handleCloseToolsModal}
          server={selectedServer}
        />
      </AppShell.Main>

    </AppShell>
  )
}

export default App
