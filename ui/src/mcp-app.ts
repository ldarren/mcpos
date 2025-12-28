import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";

// Get element references
const serverTimeEl = document.getElementById("server-time")!;
const getTimeBtn = document.getElementById("get-time-btn")!;

// Create app instance
const app = new App({ name: "Get Time App", version: "1.0.0" });

// Register handlers BEFORE connecting
app.ontoolresult = (result) => {
  const { time } = (result.structuredContent as { time?: string }) ?? {};
  serverTimeEl.textContent = time ?? "[ERROR]";
};

// Wire up button click
getTimeBtn.addEventListener("click", async () => {
  const result = await app.callServerTool({ name: "get-time", arguments: {} });
  const { time } = (result.structuredContent as { time?: string }) ?? {};
  serverTimeEl.textContent = time ?? "[ERROR]";
});

// Connect to host
app.connect(new PostMessageTransport(window.parent));