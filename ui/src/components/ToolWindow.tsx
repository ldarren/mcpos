import { getToolUiResourceUri } from "@modelcontextprotocol/ext-apps/app-bridge";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { useState, useEffect, useRef } from 'react'
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
import type { MCPServer, ToolExecution } from '../types/mcp'
import { useMCP } from '../contexts/MCPContext'
import {
  loadSandboxProxy,
  initializeApp,
  newAppBridge,
  hasAppHtml,
  log,
  type ToolCallInfo
} from '../utils/sandboxUtils'
import { mcpClient } from '../services/mcpClient'

interface ToolWindowProps {
  opened: boolean
  onClose: () => void
  tool: Tool | null
  server: MCPServer | null
}

// AppIFramePanel component for UI tools
function AppIFramePanel({ toolCallInfo }: { toolCallInfo: Required<ToolCallInfo> }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const appBridgeRef = useRef<ReturnType<typeof newAppBridge> | null>(null)

  useEffect(() => {
    const iframe = iframeRef.current!
    loadSandboxProxy(iframe).then((firstTime) => {
      // Guard against React Strict Mode's double invocation
      if (firstTime) {
        const appBridge = newAppBridge(toolCallInfo.client, iframe)
        appBridgeRef.current = appBridge
        initializeApp(iframe, appBridge, toolCallInfo)
      }
    })
  }, [toolCallInfo])

  return (
    <div style={{
      width: '100%',
      minHeight: '400px',
      border: '1px solid var(--mantine-color-default-border)',
      borderRadius: 'var(--mantine-radius-md)'
    }}>
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '400px',
          border: 'none',
          borderRadius: 'var(--mantine-radius-md)'
        }}
      />
    </div>
  )
}

export function ToolWindow({ opened, onClose, tool, server }: ToolWindowProps) {
  const { actions } = useMCP()
  const [execution, setExecution] = useState<ToolExecution | null>(null)
  const [output, setOutput] = useState<string>('')
  const [toolCallInfo, setToolCallInfo] = useState<ToolCallInfo | null>(null)
  const [hasUiResource, setHasUiResource] = useState<boolean>(false)

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

  useEffect(() => {
    setOutput('')
    setToolCallInfo(null)
    setHasUiResource(false)

    if (server?.id && tool) {
      const uiResourceUri = getToolUiResourceUri(tool)
      setHasUiResource(!!uiResourceUri)

      if (uiResourceUri) {
        log.info("Tool has UI resource:", uiResourceUri)
      } else {
        log.info("Tool has no UI resource, will use traditional output")
      }
    }
  }, [server?.id, tool?.name])

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
    setToolCallInfo(null)

    try {
      // Get the client for this server
      const clientInfo = mcpClient['clients']?.get(server.id)
      if (!clientInfo) {
        throw new Error('Not connected to server')
      }

      // Create promise for the tool call result
      const resultPromise = actions.callTool(server.id, tool.name, values)

      // Check if tool has UI resource
      const uiResourceUri = getToolUiResourceUri(tool)
      let appResourcePromise: Promise<any> | undefined

      if (hasUiResource && uiResourceUri) {
        // Create tool call info for UI tools
        appResourcePromise = actions.getUiResource(server.id, uiResourceUri)

        const newToolCallInfo: ToolCallInfo = {
          serverId: server.id,
          toolName: tool.name,
          client: clientInfo.client,
          input: values,
          resultPromise,
          appResourcePromise
        }

        setToolCallInfo(newToolCallInfo)
        log.info("Created tool call info for UI tool:", tool.name)
      } else {
        // Handle regular tools (non-UI)
        const result = await resultPromise

        if (result?.content?.[0]?.text) {
          setOutput(result.content[0].text + '\n')
        }
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
      setToolCallInfo(null)
      notifications.show({
        title: 'Execution Error',
        message: `Failed to execute ${tool.name}`,
        color: 'red'
      })
    }
  }

  const handleStop = () => {
    setExecution(prev => prev ? { ...prev, status: 'completed' } : null)
    setToolCallInfo(null)
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
                <Badge size="sm" variant="light">
                  {hasUiResource ? 'Interactive UI' : 'Output'}
                </Badge>
                {execution?.status === 'running' && (
                  <Group gap={4}>
                    <Loader size="xs" />
                    <Text size="xs" c="dimmed">Running...</Text>
                  </Group>
                )}
              </Group>
            </Group>

            {/* Show AppIFramePanel for UI tools, traditional output for regular tools */}
            {toolCallInfo && hasAppHtml(toolCallInfo) ? (
              <AppIFramePanel toolCallInfo={toolCallInfo} />
            ) : hasUiResource ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                Execute the tool to load the interactive UI.
              </Text>
            ) : (
              <ScrollArea h={200}>
                {output ? (
                  <Code block>{output}</Code>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    No output yet. Execute the tool to see results.
                  </Text>
                )}
              </ScrollArea>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Modal>
  )
}