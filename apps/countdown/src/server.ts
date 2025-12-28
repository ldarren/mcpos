import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { Request, Response } from "express"
import { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE, RESOURCE_URI_META_KEY, McpUiAppResourceConfig } from "@modelcontextprotocol/ext-apps/server"
import { CallToolResult, Notification, CallToolRequestSchema, ListToolsRequestSchema, LoggingMessageNotification, ToolListChangedNotification, JSONRPCNotification, JSONRPCErrorResponse, InitializeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as z from 'zod/v4'

const SESSION_ID_HEADER_NAME = "mcp-session-id"
const JSON_RPC = "2.0"
// Two-part registration: tool + resource
const resourceUri = "ui://get-time/mcp-app.html"

async function sendNotificationByTransport(transport: StreamableHTTPServerTransport, notification: Notification) {
    const rpcNotificaiton: JSONRPCNotification = {
        jsonrpc: JSON_RPC,
        ...notification,
    }
    await transport.send(rpcNotificaiton)
}

function createErrorResponse(message: string, code = -32000): JSONRPCErrorResponse {
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
	title: 'single-greeting',
	description: "Greet the user once.",
	inputSchema: z.object({
		name: z.string().describe("name to greet"),
	}) as z.ZodObject<{ name: z.ZodString }>
}

const singleGreetCB: ToolCallback<typeof singleGreetTool.inputSchema> = async ({name}): Promise<CallToolResult> => {
	return {
		content: [{
			type: "text",
			text: `Hey ${name}! Welcome to itsuki's world!`
		}]
	}
}

// tool that sends multiple greetings with notifications
const multiGreetTool = {
	name: 'multi-great',
	description: "Greet the user multiple times with delay in between.",
	inputSchema: z.object({
		name: z.string().describe("name to greet"),
	}) as z.ZodObject<{ name: z.ZodString }>
}

const multiGreetCB: ToolCallback<typeof singleGreetTool.inputSchema> = async ({name}: any, extra): Promise<CallToolResult> => {
	const sendNotification = extra.sendNotification
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
		content: [{
			type: "text",
			text: `Hope you enjoy your day!`
		}]
	}
}

// tool that sends multiple greetings with notifications
const countdownTool = {
	title: 'countdown',
	description: "Start a countdown from a specified number, streaming each second",
	inputSchema: {
		start: z.number().min(1).max(3600).describe("Starting number for countdown (1-3600 seconds)")
	},
	outputSchema: z.object({current: z.number()}),
	_meta: { [RESOURCE_URI_META_KEY]: resourceUri },
}

const countdownCB: ToolCallback<z.ZodRawShape> = async ({start}: any, extra): Promise<CallToolResult> => {
	const sessionId = extra.sessionId
	if (!sessionId) {
		throw new Error("Session ID is required for countdown tool.")
	}
	const sendNotification = extra.sendNotification
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
		const transport = transports[sessionId]
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

	return {
		content: [{
			type: "text",
			text: `Start Counting down from ${start} seconds! (ID: ${id})`
		}],
		structuredContent: { current },
	}
}

const	server: McpServer	= new McpServer({
	name: 'countdown-mcp-server',
	version: '0.0.1',
	icons: [{ src: './mcp.svg', sizes: ['512x512'], mimeType: 'image/svg+xml' }],
	websiteUrl: 'https://github.com/modelcontextprotocol/typescript-sdk'
}, {
	capabilities: {
		tools: {},
		logging: {}
	}
})

server.registerTool(
	'single-greeting',
	singleGreetTool,
	singleGreetCB
)

server.registerTool(
	'multi-greating',
	multiGreetTool,
	multiGreetCB
)

registerAppTool(
	server,
	'countdown',
	countdownTool,
	countdownCB
)

// to support multiple simultaneous connections
const transports: {[sessionId: string]: StreamableHTTPServerTransport} = {}
let toolInterval: NodeJS.Timeout | undefined

export async function handleGetRequest(req: Request, res: Response) {
	// if server does not offer an SSE stream at this endpoint.
	// res.status(405).set('Allow', 'POST').send('Method Not Allowed')

	const sessionId = req.headers['mcp-session-id'] as string | undefined
	console.log(`get request received [${sessionId}]`)
	if (!sessionId || !transports[sessionId]) {
		res.status(400).json(createErrorResponse("Bad Request: invalid session ID or method."))
		return
	}

	console.log(`Establishing SSE stream for session ${sessionId}`)
	const transport = transports[sessionId]
	await transport.handleRequest(req, res)

	return
}

export async function handlePostRequest(req: Request, res: Response) {
	const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined

	console.log(`post request received [${sessionId}]`)
	console.log("body: ", req.body)

	let transport: StreamableHTTPServerTransport

	try {
		// reuse existing transport
		if (sessionId && transports[sessionId]) {
			transport = transports[sessionId]
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
			// Set up onclose handler to clean up transport when closed
			transport.onclose = () => {
				const sid = transport.sessionId;
				if (sid && transports[sid]) {
					console.log(`Transport closed for session ${sid}, removing from transports map`);
					delete transports[sid];
				}
			};
			await server.connect(transport)
			await transport.handleRequest(req, res, req.body)

			// session ID will only be available (if in not Stateless-Mode)
			// after handling the first request
			const sessionId = transport.sessionId
			if (sessionId) {
				transports[sessionId] = transport
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

// Handle DELETE requests for session termination (according to MCP spec)
export async function handleDeleteRequest (req: Request, res: Response) {
	const sessionId = req.headers['mcp-session-id'] as string | undefined;
	if (!sessionId || !transports[sessionId]) {
		res.status(400).send('Invalid or missing session ID');
		return;
	}

	console.log(`Received session termination request for session ${sessionId}`);

	try {
		const transport = transports[sessionId];
		await transport.handleRequest(req, res);
	} catch (error) {
		console.error('Error handling session termination:', error);
		if (!res.headersSent) {
			res.status(500).send('Error processing session termination');
		}
	}
};

export async function handleCleanup() {
	toolInterval?.close()
	await server.close()
}

registerAppResource(
	server,
	resourceUri,
	resourceUri,
	{ mimeType: RESOURCE_MIME_TYPE } as McpUiAppResourceConfig,
  async () => {
    const html = await fs.readFile(
      path.join(import.meta.dirname, "../rcs", "mcp-app.html"),
      {encoding: "utf-8"},
    );
    return {
      contents: [
        { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
      ],
    };
  },
)