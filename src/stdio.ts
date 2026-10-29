#!/usr/bin/env node
import {
  serveStdio,
  StdioServerTransport,
} from "@modelcontextprotocol/server/stdio";
import { createTransitServer } from "./tools.js";

const transport = new StdioServerTransport(process.stdin, process.stdout, {
  maxBufferSize: 64 * 1024,
});

const server = serveStdio(() => createTransitServer(), {
  transport,
  legacy: "serve",
  onerror: () => {
    console.error("Unable to process MCP message");
  },
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void server.close().catch(() => {
      process.exitCode = 1;
    });
  });
}
