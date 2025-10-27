import express, { Request, Response } from "express"
import cors from "cors"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { MCPServer } from "./server.js"

/*******************************/
/******* Server Set Up *******/
/*******************************/

const server = new MCPServer(
    new Server({
        name: "countdown-mcp-server",
        version: "0.0.1"
    }, {
        capabilities: {
            tools: {},
            logging: {}
        }
    })
)

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
const MCP_ENDPOINT = "/mcp"

// handler
router.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
  console.log('>index.ts POST /mcp>')
    await server.handlePostRequest(req, res)
})

// Handle GET requests for SSE streams (using built-in support from StreamableHTTP)
router.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
  console.log('>index,ts GET /mcp>')
    await server.handleGetRequest(req, res)
})


app.use('/', router)

const PORT = 6001
app.listen(PORT, () => {
    console.log(`MCP Streamable HTTP Server listening on port ${PORT}`)
})

process.on('SIGINT', async () => {
    console.log('Shutting down server...')
    await server.cleanup()
    process.exit(0)
})
