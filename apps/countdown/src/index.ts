// REF: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/examples/server/simpleStreamableHttp.ts#L469
import express, {Request, Response} from 'express'
import cors from 'cors'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { handlePostRequest, handleGetRequest, handleCleanup } from './server.js'

/*******************************/
/******* Endpoint Set Up *******/
/*******************************/

const app = express()

// Setup CORS middleware
app.use(cors({
	origin: '*',
	allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'],
	exposedHeaders: ['mcp-session-id'],
	methods: ['GET', 'POST', 'OPTIONS'],
}))
app.use(express.json())

const router = express.Router()

// endpoint for the client to use for sending messages
const MCP_ENDPOINT = '/mcp'

// handler
router.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
	await handlePostRequest(req, res)
})

// Handle GET requests for SSE streams (using built-in support from StreamableHTTP)
router.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
	await handleGetRequest(req, res)
})


app.use('/', router)

const PORT = 6001
app.listen(PORT, () => {
	console.log(`MCP Streamable HTTP Server listening on port ${PORT}`)
})

process.on('SIGINT', async () => {
	console.log('Shutting down server...')
	await handleCleanup()
	process.exit(0)
})
