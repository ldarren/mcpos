import {
  Table,
  Button,
  Badge,
  Group,
  Text,
  Stack,
  Paper,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEye, IconSettings, IconPower, IconPlugOff } from '@tabler/icons-react'
import type { MCPServer } from '../types/mcp'
import { useMCP } from '../contexts/MCPContext'

interface MCPServerTableProps {
  onOpenAddModal: () => void
  onOpenToolsModal: (server: MCPServer) => void
}

export function MCPServerTable({ onOpenAddModal, onOpenToolsModal }: MCPServerTableProps) {
  const { state, actions } = useMCP()

  const handleViewTools = async (server: MCPServer) => {
    if (server.status === 'disconnected') {
      try {
        await actions.connectToServer(server.id)
      } catch (error) {
        notifications.show({
          title: 'Connection Failed',
          message: 'Failed to connect to server',
          color: 'red'
        })
        return
      }
    }

    onOpenToolsModal(server)
  }

  const handleToggleConnection = async (server: MCPServer) => {
    try {
      if (server.status === 'connected') {
        await actions.disconnectFromServer(server.id)
        notifications.show({
          title: 'Disconnected',
          message: `Disconnected from ${server.name}`,
          color: 'yellow'
        })
      } else {
        const connected = await actions.connectToServer(server.id)
        if (connected) {
          notifications.show({
            title: 'Connected',
            message: `Connected to ${server.name}`,
            color: 'green'
          })
        } else {
          notifications.show({
            title: 'Connection Failed',
            message: 'Failed to toggle connection',
            color: 'red'
          })
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Connection Error',
        message: 'Failed to toggle connection',
        color: 'red'
      })
    }
  }

  const getStatusBadgeProps = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return { color: 'green', children: 'Connected' }
      case 'connecting':
        return { color: 'yellow', children: 'Connecting' }
      case 'disconnected':
        return { color: 'red', children: 'Disconnected' }
    }
  }

  const rows = state.servers.map((server) => (
    <Table.Tr key={server.id}>
      <Table.Td>
        <Text fw={500}>{server.name}</Text>
      </Table.Td>
      <Table.Td>{server.domain}</Table.Td>
      <Table.Td>
        <Badge {...getStatusBadgeProps(server.status)} />
      </Table.Td>
      <Table.Td>
        <Group gap={8}>
          <Tooltip label={server.status === 'connected' ? 'Disconnect' : 'Connect'}>
            <ActionIcon
              variant="light"
              color={server.status === 'connected' ? 'red' : 'green'}
              onClick={() => handleToggleConnection(server)}
              loading={server.status === 'connecting'}
            >
              {server.status === 'connected' ? <IconPlugOff size={16} /> : <IconPower size={16} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="View Tools">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => handleViewTools(server)}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Settings">
            <ActionIcon variant="light" color="gray">
              <IconSettings size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return <>
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="xl" fw={600}>MCP Servers</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={onOpenAddModal}
        >
          Add Server
        </Button>
      </Group>

      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Domain</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  </>
}