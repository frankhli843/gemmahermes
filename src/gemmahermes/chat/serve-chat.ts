import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { getChatPageHtml } from "./chat-page.js";

export type ChatServerOpts = {
  /** Port the chat UI listens on. 0 = pick a free port. */
  port?: number;
  /** Backend API base URL, e.g. "http://127.0.0.1:11434". */
  backendUrl: string;
  /** Model identifier for the UI header and API calls. */
  modelId: string;
};

export type ChatServerHandle = {
  url: string;
  port: number;
  close(): Promise<void>;
};

/**
 * Start a lightweight HTTP server that serves the chat web UI and proxies
 * /v1/* requests to the local Hermes backend. Returns the URL to open.
 */
export function startChatServer(opts: ChatServerOpts): Promise<ChatServerHandle> {
  const { backendUrl, modelId } = opts;
  const requestedPort = opts.port ?? 0;
  const pageHtml = getChatPageHtml(modelId);

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Serve the chat page at root.
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(pageHtml);
      return;
    }

    // Proxy /v1/* to the backend.
    if (req.url?.startsWith("/v1/")) {
      try {
        await proxyToBackend(req, res, backendUrl);
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Backend proxy error", detail: String(err) }));
        }
      }
      return;
    }

    // Health check.
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(requestedPort, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }
      const port = addr.port;
      const url = `http://127.0.0.1:${port}`;
      resolve({
        url,
        port,
        close: () =>
          new Promise<void>((res) => {
            server.close(() => res());
          }),
      });
    });
  });
}

/**
 * Forward an incoming request to the backend, streaming the response back.
 */
async function proxyToBackend(
  req: IncomingMessage,
  res: ServerResponse,
  backendUrl: string,
): Promise<void> {
  // Collect the request body.
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks);

  const targetUrl = `${backendUrl}${req.url}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const upstream = await fetch(targetUrl, {
    method: req.method ?? "POST",
    headers,
    body: body.length > 0 ? body : undefined,
  });

  // Forward status and selected headers.
  const responseHeaders: Record<string, string> = {
    "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  const transferEncoding = upstream.headers.get("Transfer-Encoding");
  if (transferEncoding) {
    responseHeaders["Transfer-Encoding"] = transferEncoding;
  }

  res.writeHead(upstream.status, responseHeaders);

  if (!upstream.body) {
    const text = await upstream.text();
    res.end(text);
    return;
  }

  // Stream the response.
  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      res.write(value);
    }
  } finally {
    res.end();
  }
}
