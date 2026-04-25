import { exec } from "node:child_process";
import type { Command } from "commander";
import { defaultRuntime } from "../runtime.js";

export function registerChatCli(program: Command) {
  program
    .command("chat")
    .description("Open a web browser chat UI connected to your local Hermes backend")
    .option("--port <port>", "Port for the chat UI server (default: auto)", "0")
    .option("--backend-url <url>", "Backend API base URL (default: auto-detect)")
    .option("--model <id>", "Model identifier (default: auto-detect)")
    .option("--no-open", "Don't auto-open the browser")
    .action(async (opts) => {
      try {
        await runChat({
          port: Number(opts.port) || 0,
          backendUrl: opts.backendUrl as string | undefined,
          model: opts.model as string | undefined,
          open: opts.open !== false,
        });
      } catch (err) {
        defaultRuntime.error(String(err));
        defaultRuntime.exit(1);
      }
    });
}

type ChatOpts = {
  port: number;
  backendUrl?: string;
  model?: string;
  open: boolean;
};

async function runChat(opts: ChatOpts): Promise<void> {
  const { startChatServer } = await import("../gemmahermes/chat/serve-chat.js");

  // Auto-detect backend if not specified.
  let backendUrl = opts.backendUrl;
  let modelId = opts.model;

  if (!backendUrl) {
    const detected = await detectBackend();
    if (!detected) {
      defaultRuntime.error("No running Hermes backend found.");
      defaultRuntime.error("");
      defaultRuntime.error("Start one first:");
      defaultRuntime.error("  gemmahermes setup       # auto-detect and provision");
      defaultRuntime.error("  gemmahermes provision    # manual provisioning");
      defaultRuntime.error("");
      defaultRuntime.error("Or specify a backend URL:");
      defaultRuntime.error("  gemmahermes chat --backend-url http://127.0.0.1:11434");
      defaultRuntime.exit(1);
      return;
    }
    backendUrl = detected.url;
    modelId = modelId ?? detected.model;
  }

  modelId = modelId ?? "hermes3";

  const handle = await startChatServer({
    port: opts.port,
    backendUrl,
    modelId,
  });

  defaultRuntime.log("");
  defaultRuntime.log(`Chat UI running at ${handle.url}`);
  defaultRuntime.log(`Backend: ${backendUrl}`);
  defaultRuntime.log(`Model: ${modelId}`);
  defaultRuntime.log("");
  defaultRuntime.log("Press Ctrl+C to stop.");

  if (opts.open) {
    openBrowser(handle.url);
  }

  // Wait for Ctrl+C.
  await new Promise<void>((resolve) => {
    const cleanup = () => {
      defaultRuntime.log("\nShutting down...");
      void handle.close().then(resolve);
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  });
}

type DetectedBackend = { url: string; model: string };

/**
 * Try to detect a running backend on common ports.
 * Checks Ollama (11434) and llama.cpp (8080) default ports.
 */
async function detectBackend(): Promise<DetectedBackend | null> {
  const candidates = [
    { url: "http://127.0.0.1:11434", name: "Ollama" },
    { url: "http://127.0.0.1:8080", name: "llama.cpp" },
  ];

  for (const candidate of candidates) {
    try {
      // Try /v1/models to see what's available.
      const resp = await fetch(`${candidate.url}/v1/models`, {
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          data?: Array<{ id?: string }>;
        };
        // Find a Hermes model, or use the first available model.
        const models = data.data ?? [];
        const hermes = models.find((m) => m.id?.toLowerCase().includes("hermes"));
        const model = hermes?.id ?? models[0]?.id ?? "hermes3";
        return { url: candidate.url, model };
      }
    } catch {
      // Not running on this port, try next.
    }
  }

  // Also check if Ollama is running but /v1/models isn't available.
  for (const candidate of candidates) {
    try {
      const resp = await fetch(candidate.url, {
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        return { url: candidate.url, model: "hermes3" };
      }
    } catch {
      // Not available.
    }
  }

  return null;
}

function openBrowser(url: string): void {
  const platform = process.platform;
  let cmd: string;
  if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${url}"`;
  } else {
    // Linux: try xdg-open, then sensible-browser, then common browsers.
    cmd = `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || firefox "${url}" 2>/dev/null || chromium-browser "${url}" 2>/dev/null || google-chrome "${url}" 2>/dev/null`;
  }
  exec(cmd, () => {
    // Ignore errors (user might not have a browser in headless setups).
  });
}
