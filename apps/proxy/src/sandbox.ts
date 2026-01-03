// MCPOS Sandbox Proxy - Secure iframe isolation for MCP tool UIs
// Based on the MCP specification for secure iframe sandboxing

// Types for MCP UI notifications
interface McpUiSandboxProxyReadyNotification {
  jsonrpc: "2.0";
  method: "ui/notifications/sandbox-proxy-ready";
  params: Record<string, never>;
}

interface McpUiSandboxResourceReadyNotification {
  jsonrpc: "2.0";
  method: "ui/notifications/sandbox-resource-ready";
  params: {
    html: string;
    sandbox?: string;
    csp?: {
      connectDomains?: string[];
      resourceDomains?: string[];
    };
  };
}

// Allow requests from MCPOS host applications (configurable for different environments)
const ALLOWED_REFERRER_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|.*\.mcpos\.local)(:|\/|$)/;

// Security validation: ensure we're running in an iframe
if (window.self === window.top) {
  throw new Error("MCPOS Sandbox proxy must only run in an iframe sandbox.");
}

// Validate the referrer to ensure we're being embedded by an authorized host
if (!document.referrer) {
  throw new Error("No referrer found. Cannot validate embedding site.");
}

if (!document.referrer.match(ALLOWED_REFERRER_PATTERN)) {
  throw new Error(
    `Embedding domain not allowed: ${document.referrer}. Update ALLOWED_REFERRER_PATTERN to include your domain.`,
  );
}

// Critical security self-test: verify iframe isolation is working correctly
// This MUST throw a SecurityError - if window.top is accessible, the sandbox
// configuration is dangerously broken and untrusted content could escape
try {
  window.top!.alert("SECURITY BREACH: If you see this alert, the sandbox is not properly isolated.");
  throw "SECURITY_TEST_FAILED";
} catch (e) {
  if (e === "SECURITY_TEST_FAILED") {
    throw new Error("CRITICAL: Sandbox isolation is not working. This is a security vulnerability.");
  }
  // Expected: SecurityError confirms proper sandboxing
  console.log("[MCPOS Sandbox] Security validation passed - iframe is properly isolated");
}

// Create the inner iframe for untrusted HTML content
// Double-iframe architecture: THIS file runs in the outer sandbox proxy iframe
// on a separate origin. It creates an inner iframe for untrusted HTML content.
// Per the MCP specification, the Host and Sandbox MUST have different origins.
const inner = document.createElement("iframe");
inner.style.cssText = "width:100%; height:100%; border:none;";
inner.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
document.body.appendChild(inner);

// MCP notification method constants
const RESOURCE_READY_NOTIFICATION: McpUiSandboxResourceReadyNotification["method"] =
  "ui/notifications/sandbox-resource-ready";
const PROXY_READY_NOTIFICATION: McpUiSandboxProxyReadyNotification["method"] =
  "ui/notifications/sandbox-proxy-ready";

/**
 * Build Content Security Policy meta tag from CSP configuration
 * Creates a comprehensive CSP policy that allows the tool UI to function
 * while restricting dangerous operations
 */
function buildCspMetaTag(csp?: { connectDomains?: string[]; resourceDomains?: string[] }): string {
  const resourceDomains = csp?.resourceDomains?.join(" ") ?? "";
  const connectDomains = csp?.connectDomains?.join(" ") ?? "";

  // Base CSP directives - restrictive but functional for MCP tool UIs
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: ${resourceDomains}`.trim(),
    `style-src 'self' 'unsafe-inline' blob: data: ${resourceDomains}`.trim(),
    `img-src 'self' data: blob: ${resourceDomains}`.trim(),
    `font-src 'self' data: blob: ${resourceDomains}`.trim(),
    `connect-src 'self' ${connectDomains}`.trim(),
    "frame-src 'none'", // Prevent nested iframes
    "object-src 'none'", // Block plugins/objects
    "base-uri 'self'", // Restrict base tag
  ];

  return `<meta http-equiv="Content-Security-Policy" content="${directives.join("; ")}">`;
}

/**
 * Message relay system: This Sandbox (outer iframe) acts as a bidirectional bridge,
 * forwarding messages between:
 *
 *   MCPOS Host (parent window) ↔ Sandbox Proxy (this frame) ↔ Guest UI (inner iframe)
 *
 * Reason: The parent window and inner iframe have different origins and can't
 * communicate directly, so the outer iframe forwards messages in both directions.
 *
 * Special case: The "ui/notifications/sandbox-resource-ready" message is
 * intercepted here (not relayed) because the Sandbox uses it to configure and
 * load the inner iframe with the Guest UI HTML content.
 */
window.addEventListener("message", async (event) => {
  if (event.source === window.parent) {
    // Message from MCPOS Host → process or relay to Guest UI
    // NOTE: In production, you should also validate `event.origin` against
    // your authorized host domains for additional security

    if (event.data && event.data.method === RESOURCE_READY_NOTIFICATION) {
      const { html, sandbox, csp } = event.data.params;

      console.log("[MCPOS Sandbox] Received UI resource from host", { csp });

      // Configure sandbox permissions if specified
      if (typeof sandbox === "string") {
        inner.setAttribute("sandbox", sandbox);
        console.log("[MCPOS Sandbox] Applied sandbox permissions:", sandbox);
      }

      // Load HTML content with CSP injection
      if (typeof html === "string") {
        let modifiedHtml = html;

        // Inject CSP meta tag if CSP configuration is provided
        if (csp) {
          const cspMetaTag = buildCspMetaTag(csp);
          console.log("[MCPOS Sandbox] Injecting CSP meta tag:", cspMetaTag);

          // Insert CSP meta tag after <head> tag if present, otherwise prepend
          if (modifiedHtml.includes("<head>")) {
            modifiedHtml = modifiedHtml.replace("<head>", `<head>\n${cspMetaTag}`);
          } else if (modifiedHtml.includes("<head ")) {
            modifiedHtml = modifiedHtml.replace(/<head[^>]*>/, `$&\n${cspMetaTag}`);
          } else {
            // No head tag found, prepend CSP
            modifiedHtml = cspMetaTag + modifiedHtml;
          }
        } else {
          console.log("[MCPOS Sandbox] No CSP configuration provided, using browser defaults");
        }

        // Load the modified HTML into the inner iframe
        inner.srcdoc = modifiedHtml;
        console.log("[MCPOS Sandbox] Loaded UI resource into inner iframe");
      }
    } else {
      // Relay other messages from host to guest UI
      if (inner && inner.contentWindow) {
        inner.contentWindow.postMessage(event.data, "*");
      }
    }
  } else if (event.source === inner.contentWindow) {
    // Message from Guest UI → relay to MCPOS Host
    window.parent.postMessage(event.data, "*");
  }
});

// Notify the MCPOS Host that the Sandbox Proxy is ready to receive Guest UI HTML
console.log("[MCPOS Sandbox] Proxy ready, notifying host");
window.parent.postMessage({
  jsonrpc: "2.0",
  method: PROXY_READY_NOTIFICATION,
  params: {},
}, "*");