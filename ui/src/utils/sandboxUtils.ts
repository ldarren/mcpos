/**
 * MCPOS Sandbox Utilities
 *
 * Utilities for loading sandbox proxy, managing AppBridge communication,
 * and handling secure iframe interactions for MCP tool UIs
 */

import {
  AppBridge,
  PostMessageTransport,
  type McpUiSandboxProxyReadyNotification
} from "@modelcontextprotocol/ext-apps/app-bridge";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { UiResourceData } from "../services/mcpClient";

// URL to the MCPOS sandbox proxy server
const SANDBOX_PROXY_URL = new URL("http://localhost:8081/sandbox.html");

// Implementation info for AppBridge
const IMPLEMENTATION = { name: "MCPOS UI Host", version: "1.0.0" };

export const log = {
  info: console.log.bind(console, "[MCPOS Host]"),
  warn: console.warn.bind(console, "[MCPOS Host]"),
  error: console.error.bind(console, "[MCPOS Host]"),
};

/**
 * Information about a tool call with UI resources
 */
export interface ToolCallInfo {
  serverId: string;
  toolName: string;
  client: Client;
  input: Record<string, unknown>;
  resultPromise: Promise<CallToolResult>;
  appResourcePromise?: Promise<UiResourceData>;
}

/**
 * Load the sandbox proxy into an iframe and wait for it to be ready
 */
export function loadSandboxProxy(iframe: HTMLIFrameElement): Promise<boolean> {
  // Prevent reload if already loaded
  if (iframe.src) return Promise.resolve(false);

  // Set sandbox permissions for security
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");

  const readyNotification: McpUiSandboxProxyReadyNotification["method"] =
    "ui/notifications/sandbox-proxy-ready";

  const readyPromise = new Promise<boolean>((resolve) => {
    const listener = ({ source, data }: MessageEvent) => {
      if (source === iframe.contentWindow && data?.method === readyNotification) {
        log.info("MCPOS Sandbox proxy loaded successfully");
        window.removeEventListener("message", listener);
        resolve(true);
      }
    };
    window.addEventListener("message", listener);
  });

  log.info("Loading MCPOS sandbox proxy...");
  iframe.src = SANDBOX_PROXY_URL.href;

  return readyPromise;
}

/**
 * Initialize a tool UI app in the sandbox iframe
 */
export async function initializeApp(
  iframe: HTMLIFrameElement,
  appBridge: AppBridge,
  { input, resultPromise, appResourcePromise }: Required<ToolCallInfo>,
): Promise<void> {
  const appInitializedPromise = hookInitializedCallback(appBridge);

  // Connect app bridge (triggers MCP initialization handshake)
  // Pass iframe.contentWindow as both target and source for security
  await appBridge.connect(
    new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!),
  );

  // Load inner iframe HTML with CSP metadata
  const { html, csp } = await appResourcePromise;
  log.info("Sending UI resource HTML to MCP App", csp ? `(CSP: ${JSON.stringify(csp)})` : "");
  await appBridge.sendSandboxResourceReady({ html, csp });

  // Wait for inner iframe to be ready
  log.info("Waiting for MCP App to initialize...");
  await appInitializedPromise;
  log.info("MCP App initialized successfully");

  // Send tool call input to iframe
  log.info("Sending tool call input to MCP App:", input);
  appBridge.sendToolInput({ arguments: input });

  // Schedule tool call result (or cancellation) to be sent to MCP App
  resultPromise.then(
    (result) => {
      log.info("Sending tool call result to MCP App:", result);
      appBridge.sendToolResult(result);
    },
    (error) => {
      log.error("Tool call failed, sending cancellation to MCP App:", error);
      appBridge.sendToolCancelled({
        reason: error instanceof Error ? error.message : String(error),
      });
    },
  );
}

/**
 * Create a new AppBridge for communication with the sandbox
 */
export function newAppBridge(client: Client, iframe: HTMLIFrameElement): AppBridge {
  const serverCapabilities = client.getServerCapabilities();
  const appBridge = new AppBridge(client, IMPLEMENTATION, {
    openLinks: {},
    serverTools: serverCapabilities?.tools,
    serverResources: serverCapabilities?.resources,
  });

  // Register all handlers before calling connect()
  // The Guest UI can start sending requests immediately after initialization

  appBridge.onmessage = async (params, _extra) => {
    log.info("Message from MCP App:", params);
    return {};
  };

  appBridge.onopenlink = async (params, _extra) => {
    log.info("Open link request:", params);
    window.open(params.url, "_blank", "noopener,noreferrer");
    return {};
  };

  appBridge.onloggingmessage = (params) => {
    log.info("Log message from MCP App:", params);
  };

  // Handle dynamic iframe resizing
  appBridge.onsizechange = async ({ width, height }) => {
    const style = getComputedStyle(iframe);
    const isBorderBox = style.boxSizing === "border-box";

    // Animate the change for smooth transitions
    const from: Keyframe = {};
    const to: Keyframe = {};

    if (width !== undefined) {
      if (isBorderBox) {
        width += parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
      }
      // Use min-width to allow responsive growing
      from.minWidth = `${iframe.offsetWidth}px`;
      iframe.style.minWidth = to.minWidth = `min(${width}px, 100%)`;
    }

    if (height !== undefined) {
      if (isBorderBox) {
        height += parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      }
      from.height = `${iframe.offsetHeight}px`;
      iframe.style.height = to.height = `${height}px`;
    }

    // Smooth animation
    iframe.animate([from, to], { duration: 300, easing: "ease-out" });
  };

  return appBridge;
}

/**
 * Hook into AppBridge.oninitialized and return a Promise that resolves when
 * the MCP App is initialized (i.e., when the inner iframe is ready)
 */
function hookInitializedCallback(appBridge: AppBridge): Promise<void> {
  const oninitialized = appBridge.oninitialized;
  return new Promise<void>((resolve) => {
    appBridge.oninitialized = (...args) => {
      resolve();
      appBridge.oninitialized = oninitialized;
      appBridge.oninitialized?.(...args);
    };
  });
}

/**
 * Check if a tool call has app HTML resources
 */
export function hasAppHtml(toolCallInfo: ToolCallInfo): toolCallInfo is Required<ToolCallInfo> {
  return !!toolCallInfo.appResourcePromise;
}