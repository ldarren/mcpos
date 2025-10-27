import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Notification, CallToolRequestSchema, ListToolsRequestSchema, LoggingMessageNotification, ToolListChangedNotification, JSONRPCNotification, JSONRPCError, InitializeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { Request, Response } from "express"

const SESSION_ID_HEADER_NAME = "mcp-session-id"
const JSON_RPC = "2.0"

async function sendNotificationByTransport(transport: StreamableHTTPServerTransport, notification: Notification) {
    const rpcNotificaiton: JSONRPCNotification = {
        jsonrpc: JSON_RPC,
        ...notification,
    }
    await transport.send(rpcNotificaiton)
}

function createErrorResponse(message: string, code = -32000): JSONRPCError {
    return {
        jsonrpc: JSON_RPC,
        id: randomUUID(),
        error: {
            code,
            message,
        },
    }
}

function isInitializeRequest(body: any): boolean {
    const isInitial = (data: any) => {
        const result = InitializeRequestSchema.safeParse(data)
        return result.success
    }
    if (Array.isArray(body)) {
        return body.some(request => isInitial(request))
    }
    return isInitial(body)
}

// tool that returns a single greeting
const singleGreetTool = {
    name: 'single-greeting',
    description: "Greet the user once.",
    inputSchema: {
        type: "object",
        properties: {
            name: {
                type: "string" ,
                description: "name to greet"
            },
        },
        required: ["name"]
    }
}

// tool that sends multiple greetings with notifications
const multiGreetTool = {
    name: 'multi-great',
    description: "Greet the user multiple times with delay in between.",
    inputSchema: {
        type: "object",
        properties: {
            name: {
                type: "string" ,
                description: "name to greet"
            },
        },
        required: ["name"]
    }
}

// tool that sends multiple greetings with notifications
const callbackTool = {
    name: 'countdown',
    description: "Start a countdown from a specified number, streaming each second",
    inputSchema: {
        type: "object",
        properties: {
            start: {
                type: "number",
                description: "Starting number for countdown (1-3600 seconds)",
                minimum: 1,
                maximum: 3600
            },
        },
        required: ["start"]
    }
}

export class MCPServer {
    server: Server

    // to support multiple simultaneous connections
    transports: {[sessionId: string]: StreamableHTTPServerTransport} = {}

    private toolInterval: NodeJS.Timeout | undefined

    constructor(server: Server) {
        this.server = server
        this.setupTools()
    }

    async handleGetRequest(req: Request, res: Response) {
        // if server does not offer an SSE stream at this endpoint.
        // res.status(405).set('Allow', 'POST').send('Method Not Allowed')

        const sessionId = req.headers['mcp-session-id'] as string | undefined
        console.log(`get request received [${sessionId}]`)
        if (!sessionId || !this.transports[sessionId]) {
            res.status(400).json(createErrorResponse("Bad Request: invalid session ID or method."))
            return
        }

        console.log(`Establishing SSE stream for session ${sessionId}`)
        const transport = this.transports[sessionId]
        await transport.handleRequest(req, res)

        return
    }

    async handlePostRequest(req: Request, res: Response) {
        const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined

        console.log(`post request received [${sessionId}]`)
        console.log("body: ", req.body)

        let transport: StreamableHTTPServerTransport

        try {
            // reuse existing transport
            if (sessionId && this.transports[sessionId]) {
                transport = this.transports[sessionId]
                await transport.handleRequest(req, res, req.body)
                return
            }

            // create new transport
            if (!sessionId && isInitializeRequest(req.body)) {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    // for stateless mode:
                    // sessionIdGenerator: () => undefined
                })

                await this.server.connect(transport)
                await transport.handleRequest(req, res, req.body)

                // session ID will only be available (if in not Stateless-Mode)
                // after handling the first request
                const sessionId = transport.sessionId
                if (sessionId) {
                    this.transports[sessionId] = transport
                }

                return
            }

            res.status(400).json(createErrorResponse("Bad Request: invalid session ID or method."))
            return

        } catch (error) {

            console.error('Error handling MCP request:', error)
            res.status(500).json(createErrorResponse("Internal server error."))
            return
        }
    }

    async cleanup() {
        this.toolInterval?.close()
        await this.server.close()
    }

    private setupTools() {

        // Define available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [callbackTool, singleGreetTool, multiGreetTool]
            }
        })

        // handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
            console.log("tool request received: ", request)
            console.log("extra: ", extra)

            const args = request.params.arguments

            if (!args) {
                throw new Error("arguments undefined")
            }

            const sessionId = extra.sessionId
            const sendNotification = extra.sendNotification

            if (!sessionId || !sendNotification) {
                throw new Error("no sessionId or notification")
            }
            const toolName = request.params.name

            switch (toolName) {
                case singleGreetTool.name:
                    {
                        const { name } = args

                        if (!name) {
                            throw new Error("Name to greet undefined.")
                        }

                        return {
                            content: [ {
                                type: "text",
                                text: `Hey ${name}! Welcome to itsuki's world!`
                            }]
                        }
                    }
                case multiGreetTool.name:
                    {
                        const { name } = args
                        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

                        let notification: LoggingMessageNotification = {
                            method: "notifications/message",
                            params: { level: "info", data: `First greet to ${name}` }
                        }

                        await sendNotification(notification)

                        await sleep(1000)

                        notification.params.data = `Second greet to ${name}`
                        await sendNotification(notification);

                        await sleep(1000)

                        return {
                            content: [ {
                                type: "text",
                                text: `Hope you enjoy your day!`
                            }]
                        }
                    }
                case callbackTool.name:
                    {
                        const { start } = args as Record<string, number>
                        if (!start || start < 1 || start > 3600) {
                            throw new Error('Start number must be between 1 and 3600')
                        }
                        const id = `cb-${Date.now().toString(36)}`
                        let current = start
                        console.log('Starting countdown initialization')

                        const notification: LoggingMessageNotification = {
                            method: "notifications/message",
                            params: { level: "info", data: `Starting countdown from ${start} with ID: ${id}` }
                        }
                        sendNotification(notification)

                        // Start countdown in background
                        const interval = setInterval(async () => {
                            const transport = this.transports[sessionId]
                            const message: LoggingMessageNotification = {
                                method: "notifications/message",
                                params: { level: "info", data: `Countdown: ${current}` }
                            }

                            console.log(`Attempting to send notification for countdown: ${current}`)
                            await sendNotificationByTransport(transport, message)

                            current--

                            if (current < 0) {
                                clearInterval(interval)

                                // Send completion notification
                                const completionMessage: LoggingMessageNotification = {
                                    method: "notifications/message",
                                    params: { level: "info", data: `🎉 Countdown ${id} finished!` }
                                }

                                await sendNotificationByTransport(transport, completionMessage)
                            }
                        }, 1000)
                    }
                    break
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool not found [${toolName}]`,
                    },
                ],
            }
        })
    }
}