#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE, RESOURCE_URI_META_KEY } from "@modelcontextprotocol/ext-apps/server";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { startServer } from "./src/server-utils.js"

const DIST_DIR = path.resolve(import.meta.dirname, "dist");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4001;

// Mock data stores (in a real implementation, these would be databases)
let translationHistory: any[] = [
  {
    id: "1",
    fileName: "Business_Contract_2024.pdf",
    originalSize: "2.4 MB",
    sourceLang: "en",
    targetLang: "es",
    status: "completed",
    translatedAt: "2024-12-31T10:30:00Z",
    downloadUrl: "#",
    wordCount: 1245,
    translationTime: "3.2 minutes"
  }
];

let glossaryEntries: any[] = [
  {
    id: "1",
    sourceTerm: "machine learning",
    targetTerm: "aprendizaje automático",
    sourceLang: "en",
    targetLang: "es",
    context: "AI and technology context",
    category: "Technical",
    confidence: 95,
    usage_count: 23,
    lastUsed: "2024-12-31T10:30:00Z",
    createdAt: "2024-12-01T09:00:00Z"
  }
];

let translationMemory: any[] = [
  {
    id: "tm1",
    sourceText: "Please review the attached document carefully before signing.",
    targetText: "Por favor, revise cuidadosamente el documento adjunto antes de firmar.",
    sourceLang: "en",
    targetLang: "es",
    confidence: 94,
    context: "Legal document review",
    lastUsed: "2024-12-31T10:30:00Z",
    usageCount: 8
  }
];

function createServer(): McpServer {
  const server = new McpServer({
    name: "Document Translation Server",
    version: "1.0.0",
  });

  // Define resource URIs for each page
  const uploadResourceUri = "ui://doc-translator/upload.html";
  const historyResourceUri = "ui://doc-translator/history.html";
  const glossaryResourceUri = "ui://doc-translator/glossary.html";

  // ============================================================================
  // UPLOAD DOCUMENT TOOLS
  // ============================================================================
  const translateDocumentSchema = z.object({
    fileName: z.string().describe("Name of the file to translate"),
    fileSize: z.number().describe("Size of the file in bytes"),
    sourceLang: z.string().describe("Source language code"),
    targetLang: z.string().describe("Target language code"),
    jobId: z.string().describe("Unique job identifier"),
  });

  registerAppTool(
    server,
    "translate-document",
    {
      title: "Translate Document",
      description: "Upload and translate a document to another language",
      inputSchema: translateDocumentSchema.shape,
      _meta: { [RESOURCE_URI_META_KEY]: uploadResourceUri },
    },
    async (args): Promise<CallToolResult> => {
      console.log(`[TRANSLATE] Starting translation job ${args.jobId} for ${args.fileName}`);
      console.log(`[TRANSLATE] ${args.sourceLang} -> ${args.targetLang}, Size: ${args.fileSize} bytes`);

      // Simulate document processing
      const wordCount = Math.floor((args.fileSize as number) / 5); // Rough estimate: 5 bytes per word
      const translationTime = Math.ceil(wordCount / 200); // ~200 words per minute

      // Add to translation history
      const historyItem = {
        id: args.jobId,
        fileName: args.fileName,
        originalSize: `${((args.fileSize as number) / 1024 / 1024).toFixed(1)} MB`,
        sourceLang: args.sourceLang,
        targetLang: args.targetLang,
        status: "processing",
        translatedAt: new Date().toISOString(),
        downloadUrl: `#download-${args.jobId}`,
        wordCount,
        translationTime: `${translationTime.toFixed(1)} minutes`
      };

      translationHistory.unshift(historyItem);

      return {
        content: [
          {
            type: "text",
            text: `Translation job ${args.jobId} started successfully. Estimated completion in ${translationTime.toFixed(1)} minutes.`
          }
        ]
      };
    }
  );

  // Register upload resource
  registerAppResource(
    server,
    uploadResourceUri,
    uploadResourceUri,
    { mimeType: RESOURCE_MIME_TYPE, _meta: { ui: {} } },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "upload", "upload.html"), "utf-8");
      return {
        contents: [
          { uri: uploadResourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    }
  );

  // ============================================================================
  // TRANSLATION HISTORY TOOLS
  // ============================================================================

  registerAppTool(
    server,
    "get-translation-history",
    {
      title: "Get Translation History",
      description: "Retrieve the history of all document translations",
      inputSchema: {},
      _meta: { [RESOURCE_URI_META_KEY]: historyResourceUri },
    },
    async (): Promise<CallToolResult> => {
      console.log("[HISTORY] Retrieving translation history");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: translationHistory.length,
              items: translationHistory
            }, null, 2)
          }
        ]
      };
    }
  );

  const downloadTranslationSchema = z.object({
    translationId: z.string().describe("ID of the translation to download"),
    fileName: z.string().describe("Original file name")
  });

  registerAppTool(
    server,
    "download-translation",
    {
      title: "Download Translation",
      description: "Download a completed translation",
      inputSchema: downloadTranslationSchema.shape,
      _meta: { [RESOURCE_URI_META_KEY]: historyResourceUri },
    },
    async (args): Promise<CallToolResult> => {
      console.log(`[DOWNLOAD] Initiating download for translation ${args.translationId}`);

      // In a real implementation, this would generate a download URL or stream the file
      const item = translationHistory.find(h => h.id === args.translationId);

      if (!item) {
        return {
          content: [
            {
              type: "text",
              text: `Translation with ID ${args.translationId} not found.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Download initiated for ${args.fileName}. File would be downloaded in a real implementation.`
          }
        ]
      };
    }
  );

  const deleteTranslationSchema = z.object({
    translationId: z.string().describe("ID of the translation to delete")
  });

  registerAppTool(
    server,
    "delete-translation",
    {
      title: "Delete Translation",
      description: "Delete a translation from history",
      inputSchema: deleteTranslationSchema.shape,
      _meta: { [RESOURCE_URI_META_KEY]: historyResourceUri },
    },
    async (args): Promise<CallToolResult> => {
      console.log(`[DELETE] Deleting translation ${args.translationId}`);

      const index = translationHistory.findIndex(h => h.id === args.translationId);
      if (index === -1) {
        return {
          content: [
            {
              type: "text",
              text: `Translation with ID ${args.translationId} not found.`
            }
          ]
        };
      }

      const deleted = translationHistory.splice(index, 1)[0];

      return {
        content: [
          {
            type: "text",
            text: `Translation "${deleted.fileName}" deleted successfully.`
          }
        ]
      };
    }
  );

  // Register history resource
  registerAppResource(
    server,
    historyResourceUri,
    historyResourceUri,
    { mimeType: RESOURCE_MIME_TYPE, _meta: { ui: {} } },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "history", "history.html"), "utf-8");
      return {
        contents: [
          { uri: historyResourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    }
  );

  // ============================================================================
  // GLOSSARY AND TRANSLATION MEMORY TOOLS
  // ============================================================================

  const getGlossarySchema = z.object({});

  registerAppTool(
    server,
    "get-glossary",
    {
      title: "Get Glossary",
      description: "Retrieve all glossary entries",
      inputSchema: getGlossarySchema.shape,
      _meta: { [RESOURCE_URI_META_KEY]: glossaryResourceUri },
    },
    async (): Promise<CallToolResult> => {
      console.log("[GLOSSARY] Retrieving glossary entries");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: glossaryEntries.length,
              entries: glossaryEntries
            }, null, 2)
          }
        ]
      };
    }
  );

  const getTranslationMemorySchema = z.object({});

  registerAppTool(
    server,
    "get-translation-memory",
    {
      title: "Get Translation Memory",
      description: "Retrieve translation memory segments",
      inputSchema: getTranslationMemorySchema.shape,
      _meta: { [RESOURCE_URI_META_KEY]: glossaryResourceUri },
    },
    async (): Promise<CallToolResult> => {
      console.log("[MEMORY] Retrieving translation memory segments");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: translationMemory.length,
              segments: translationMemory
            }, null, 2)
          }
        ]
      };
    }
  );

  const addGlossaryEntrySchema = z.object({
    sourceTerm: z.string().describe("Source language term"),
    targetTerm: z.string().describe("Target language term"),
    sourceLang: z.string().describe("Source language code"),
    targetLang: z.string().describe("Target language code"),
    context: z.string().optional().describe("Context or usage notes"),
    category: z.string().describe("Category of the term")
  });

  registerAppTool(
    server,
    "add-glossary-entry",
    {
      title: "Add Glossary Entry",
      description: "Add a new term to the glossary",
      inputSchema: addGlossaryEntrySchema.shape,
      _meta: { [RESOURCE_URI_META_KEY]: glossaryResourceUri },
    },
    async (args): Promise<CallToolResult> => {
      console.log(`[GLOSSARY] Adding new entry: ${args.sourceTerm} -> ${args.targetTerm}`);

      const newEntry = {
        id: Date.now().toString(),
        sourceTerm: args.sourceTerm,
        targetTerm: args.targetTerm,
        sourceLang: args.sourceLang,
        targetLang: args.targetLang,
        context: args.context || "",
        category: args.category,
        confidence: 85, // Default confidence for user-added entries
        usage_count: 0,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      glossaryEntries.unshift(newEntry);

      return {
        content: [
          {
            type: "text",
            text: `Glossary entry added: "${args.sourceTerm}" -> "${args.targetTerm}"`
          }
        ]
      };
    }
  );

  const deleteGlossaryEntrySchema = z.object({
    entryId: z.string().describe("ID of the glossary entry to delete")
  });

  registerAppTool(
    server,
    "delete-glossary-entry",
    {
      title: "Delete Glossary Entry",
      description: "Delete a glossary entry",
      inputSchema: deleteGlossaryEntrySchema.shape,
      _meta: { [RESOURCE_URI_META_KEY]: glossaryResourceUri },
    },
    async (args): Promise<CallToolResult> => {
      console.log(`[GLOSSARY] Deleting entry ${args.entryId}`);

      const index = glossaryEntries.findIndex(e => e.id === args.entryId);
      if (index === -1) {
        return {
          content: [
            {
              type: "text",
              text: `Glossary entry with ID ${args.entryId} not found.`
            }
          ]
        };
      }

      const deleted = glossaryEntries.splice(index, 1)[0];

      return {
        content: [
          {
            type: "text",
            text: `Glossary entry "${deleted.sourceTerm}" deleted successfully.`
          }
        ]
      };
    }
  );

  // Register glossary resource
  registerAppResource(
    server,
    glossaryResourceUri,
    glossaryResourceUri,
    { mimeType: RESOURCE_MIME_TYPE, _meta: { ui: {} } },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "glossary", "glossary.html"), "utf-8");
      return {
        contents: [
          { uri: glossaryResourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    }
  );

  return server;
}

async function main() {
  console.log(`✅ Document Translation MCP Server starting...`);
  console.log(`📁 Serving built files from: ${DIST_DIR}`);
  console.log(`🔧 Available tools:`);
  console.log(`   - translate-document (Upload page)`);
  console.log(`   - get-translation-history, download-translation, delete-translation (History page)`);
  console.log(`   - get-glossary, get-translation-memory, add-glossary-entry, delete-glossary-entry (Glossary page)`);
  console.log(`\n🌐 Test the HTML pages:`);
  console.log(`   - Upload: http://localhost:${PORT}/upload/upload.html`);
  console.log(`   - History: http://localhost:${PORT}/history/history.html`);
  console.log(`   - Glossary: http://localhost:${PORT}/glossary/glossary.html`);

  // Start the MCP server with proper HTTP transport
  await startServer(createServer);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createServer };