#!/usr/bin/env bun

/**
 * Simple monitoring dashboard for Cloudflare Worker
 * Demonstrates DevScript with a real-world use case
 */

import { serve } from "bun";

const WORKER_URL = process.argv[2] || process.env.WORKER_URL;
const PORT = 3002;

if (!WORKER_URL) {
  console.error("❌ Error: WORKER_URL is required");
  console.error("Usage: bun run dashboard.ts <worker-url>");
  process.exit(1);
}

interface RequestLog {
  timestamp: number;
  status: number;
  duration: number;
  error?: string;
}

const logs: RequestLog[] = [];
let successCount = 0;
let errorCount = 0;

// Poll the worker every 2 seconds
async function pollWorker() {
  const start = Date.now();
  try {
    const response = await fetch(WORKER_URL!);
    const duration = Date.now() - start;

    logs.unshift({
      timestamp: Date.now(),
      status: response.status,
      duration,
    });

    if (response.ok) {
      successCount++;
    } else {
      errorCount++;
    }

    // Keep only last 10 logs
    if (logs.length > 10) {
      logs.pop();
    }
  } catch (error) {
    const duration = Date.now() - start;
    logs.unshift({
      timestamp: Date.now(),
      status: 0,
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
    errorCount++;

    if (logs.length > 10) {
      logs.pop();
    }
  }
}

// Start polling
setInterval(pollWorker, 2000);
pollWorker(); // Initial poll

// Serve dashboard HTTP interface
const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      // Return HTML dashboard
      return new Response(
        `
<!DOCTYPE html>
<html>
<head>
  <title>Dev Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #38bdf8;
    }
    .subtitle {
      color: #94a3b8;
      margin-bottom: 2rem;
      font-size: 0.875rem;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat {
      background: #1e293b;
      padding: 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid #334155;
    }
    .stat-label {
      font-size: 0.875rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #38bdf8;
    }
    .logs {
      background: #1e293b;
      border-radius: 0.5rem;
      border: 1px solid #334155;
      overflow: hidden;
    }
    .logs-header {
      padding: 1rem;
      border-bottom: 1px solid #334155;
      font-weight: 600;
    }
    .log-entry {
      padding: 1rem;
      border-bottom: 1px solid #334155;
      display: grid;
      grid-template-columns: 150px 80px 100px 1fr;
      gap: 1rem;
      align-items: center;
      font-size: 0.875rem;
    }
    .log-entry:last-child { border-bottom: none; }
    .log-entry:hover { background: #334155; }
    .status-ok { color: #22c55e; }
    .status-error { color: #ef4444; }
    .worker-url {
      background: #1e293b;
      padding: 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #334155;
      font-family: monospace;
      font-size: 0.875rem;
      margin-bottom: 2rem;
      word-break: break-all;
    }
    .refresh {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-top: 1rem;
    }
  </style>
  <script>
    // Auto-refresh every 2 seconds
    setInterval(() => {
      fetch('/api/status')
        .then(r => r.json())
        .then(data => {
          document.getElementById('success').textContent = data.successCount;
          document.getElementById('errors').textContent = data.errorCount;
          document.getElementById('total').textContent = data.totalRequests;
          
          const logsHtml = data.logs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const statusClass = log.error ? 'status-error' : 'status-ok';
            const status = log.error ? 'ERROR' : \`\${log.status}\`;
            return \`
              <div class="log-entry">
                <div>\${time}</div>
                <div class="\${statusClass}">\${status}</div>
                <div>\${log.duration}ms</div>
                <div>\${log.error || 'OK'}</div>
              </div>
            \`;
          }).join('');
          
          document.getElementById('logs').innerHTML = logsHtml;
        });
    }, 2000);
  </script>
</head>
<body>
  <div class="container">
    <h1>🎯 Dev Dashboard</h1>
    <p class="subtitle">Monitoring Local Dev with Alchemy DevScript</p>
    
    <div class="worker-url">
      <strong>Worker URL:</strong> ${WORKER_URL}
    </div>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Success</div>
        <div class="stat-value" id="success">${successCount}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Errors</div>
        <div class="stat-value" id="errors">${errorCount}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total Requests</div>
        <div class="stat-value" id="total">${successCount + errorCount}</div>
      </div>
    </div>
    
    <div class="logs">
      <div class="logs-header">Recent Requests</div>
      <div id="logs">
        ${logs
          .map(
            (log) => `
          <div class="log-entry">
            <div>${new Date(log.timestamp).toLocaleTimeString()}</div>
            <div class="${log.error ? "status-error" : "status-ok"}">${
              log.error ? "ERROR" : log.status
            }</div>
            <div>${log.duration}ms</div>
            <div>${log.error || "OK"}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    
    <p class="refresh">Auto-refreshing every 2 seconds...</p>
  </div>
</body>
</html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    if (url.pathname === "/api/status") {
      // Return JSON status
      return new Response(
        JSON.stringify({
          workerUrl: WORKER_URL,
          successCount,
          errorCount,
          totalRequests: successCount + errorCount,
          logs,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Dashboard running at http://localhost:${PORT}`);
console.log(`Monitoring: ${WORKER_URL}`);
console.log(`Press Ctrl+C to stop`);

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down dashboard...");
  server.stop();
  process.exit(0);
});
