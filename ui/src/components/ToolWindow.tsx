import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  Paper,
  NumberInput,
  TextInput,
  Select,
  Switch,
  Slider,
  Textarea,
  Code,
  ScrollArea,
  Divider,
  Badge,
  Loader
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react'
import type { MCPServer, MCPTool, ToolExecution } from '../types/mcp'
import { useMCP } from '../contexts/MCPContext'

interface ToolWindowProps {
  opened: boolean
  onClose: () => void
  tool: MCPTool | null
  server: MCPServer | null
}

export function ToolWindow({ opened, onClose, tool, server }: ToolWindowProps) {
  const { actions } = useMCP()
  const [execution, setExecution] = useState<ToolExecution | null>(null)
  const [output, setOutput] = useState<string>('')

  const form = useForm({
    initialValues: {},
    validate: (values) => {
      if (!tool) return {}

      const errors: Record<string, string> = {}
      const required = tool.inputSchema?.required || []

      required.forEach((field: string) => {
        if (!values[field as keyof typeof values]) {
          errors[field] = `${field} is required`
        }
      })

      return errors
    }
  })

  // Listen for notifications from this server
  useEffect(() => {
    if (!server) return

    const handleNotification = (event: CustomEvent) => {
      const { serverId, notification } = event.detail
      if (serverId === server.id) {
        const message = notification.params?.data || JSON.stringify(notification)
        setOutput(prev => prev + message + '\n')
      }
    }

    window.addEventListener('mcp-notification', handleNotification as EventListener)

    return () => {
      window.removeEventListener('mcp-notification', handleNotification as EventListener)
    }
  }, [server?.id])

  const renderInputField = (propName: string, propSchema: any) => {
    const isRequired = tool?.inputSchema?.required?.includes(propName) || false

    switch (propSchema.type) {
      case 'string':
        if (propSchema.enum) {
          return (
            <Select
              key={propName}
              label={propName}
              description={propSchema.description}
              data={propSchema.enum}
              required={isRequired}
              {...form.getInputProps(propName)}
            />
          )
        }
        return (
          <TextInput
            key={propName}
            label={propName}
            description={propSchema.description}
            required={isRequired}
            {...form.getInputProps(propName)}
          />
        )

      case 'number':
      case 'integer':
        if (propSchema.minimum !== undefined && propSchema.maximum !== undefined) {
          return (
            <Stack key={propName} gap={4}>
              <Text size="sm" fw={500}>
                {propName} {isRequired && <Text span c="red">*</Text>}
              </Text>
              {propSchema.description && (
                <Text size="xs" c="dimmed">{propSchema.description}</Text>
              )}
              <Slider
                min={propSchema.minimum}
                max={propSchema.maximum}
                step={1}
                marks={[
                  { value: propSchema.minimum, label: propSchema.minimum },
                  { value: propSchema.maximum, label: propSchema.maximum }
                ]}
                {...form.getInputProps(propName)}
              />
            </Stack>
          )
        }
        return (
          <NumberInput
            key={propName}
            label={propName}
            description={propSchema.description}
            required={isRequired}
            min={propSchema.minimum}
            max={propSchema.maximum}
            {...form.getInputProps(propName)}
          />
        )

      case 'boolean':
        return (
          <Switch
            key={propName}
            label={propName}
            description={propSchema.description}
            {...form.getInputProps(propName, { type: 'checkbox' })}
          />
        )

      default:
        return (
          <Textarea
            key={propName}
            label={propName}
            description={propSchema.description}
            required={isRequired}
            {...form.getInputProps(propName)}
          />
        )
    }
  }

  const handleExecute = async (values: Record<string, any>) => {
    if (!tool || !server) return

    const newExecution: ToolExecution = {
      toolName: tool.name,
      serverId: server.id,
      parameters: values,
      status: 'running',
      isStreaming: tool.name === 'countdown' // Countdown tool streams output
    }

    setExecution(newExecution)
    setOutput('')

    try {
      // Call the real MCP server
      const result = await actions.callTool(server.id, tool.name, values)

      // Set initial result
      if (result?.content?.[0]?.text) {
        setOutput(result.content[0].text + '\n')
      }

      setExecution(prev => prev ? { ...prev, status: 'completed' } : null)
      notifications.show({
        title: 'Tool Executed',
        message: `${tool.name} started successfully`,
        color: 'green'
      })
    } catch (error) {
      setExecution(prev => prev ? { ...prev, status: 'error' } : null)
      setOutput('Error executing tool: ' + (error as Error).message)
      notifications.show({
        title: 'Execution Error',
        message: `Failed to execute ${tool.name}`,
        color: 'red'
      })
    }
  }

  const handleStop = () => {
    setExecution(prev => prev ? { ...prev, status: 'completed' } : null)
    notifications.show({
      title: 'Tool Stopped',
      message: 'Execution was stopped',
      color: 'yellow'
    })
  }

  if (!tool) return null

  const properties = tool.inputSchema?.properties || {}
  const inputFields = Object.entries(properties).map(([name, schema]) =>
    renderInputField(name, schema)
  )

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${tool.name} - ${server?.name}`}
      size="xl"
      centered
    >
      <Stack gap="md">
        {tool.description && (
          <Paper p="sm" withBorder>
            <Text size="sm">{tool.description}</Text>
          </Paper>
        )}

        {/* Input Form */}
        <Paper p="md" withBorder>
          <form onSubmit={form.onSubmit(handleExecute)}>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>Parameters</Text>
                <Badge size="sm" variant="light">Input</Badge>
              </Group>

              {inputFields.length > 0 ? (
                <Stack gap="sm">{inputFields}</Stack>
              ) : (
                <Text size="sm" c="dimmed">No parameters required</Text>
              )}

              <Group justify="flex-end">
                {execution?.status === 'running' ? (
                  <Button
                    leftSection={<IconPlayerStop size={16} />}
                    color="red"
                    onClick={handleStop}
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    leftSection={<IconPlayerPlay size={16} />}
                  >
                    Execute
                  </Button>
                )}
              </Group>
            </Stack>
          </form>
        </Paper>

        <Divider />

        {/* Output */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500}>Output</Text>
              <Group gap="xs">
                <Badge size="sm" variant="light">Output</Badge>
                {execution?.status === 'running' && (
                  <Group gap={4}>
                    <Loader size="xs" />
                    <Text size="xs" c="dimmed">Running...</Text>
                  </Group>
                )}
              </Group>
            </Group>

            <ScrollArea h={200}>
              {output ? (
                <Code block>{output}</Code>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No output yet. Execute the tool to see results.
                </Text>
              )}
            </ScrollArea>
          </Stack>
        </Paper>
      </Stack>
    </Modal>
  )
}