import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";
import { DevScript } from "alchemy/os";

const app = await alchemy("os-dev-script");

// Deploy a simple worker
export const worker = await Worker("api", {
  script: `
    export default {
      async fetch(request) {
        return new Response(JSON.stringify({
          message: "Hello from Worker!",
          timestamp: Date.now(),
          url: request.url
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  `,
  adopt: true,
});

// Start a local monitoring dashboard that watches the worker
export const dashboard = await DevScript("dashboard", {
  script: `bun run --hot src/dashboard.ts ${worker.url}`,
  extract: (line) => line.match(/Dashboard running at (http:\/\/[^\s]+)/)?.[1],
  env: {
    WORKER_URL: worker.url,
    NODE_ENV: "development",
  },
  restartOnUpdate: "on-change",
});

console.log("\n🚀 Deployment Complete!");
console.log("━".repeat(50));
console.log(`📡 Worker URL:    ${worker.url}`);
console.log(
  `🎯 Dashboard URL: ${dashboard.extracted || "(not running in production)"}`,
);
console.log("━".repeat(50));

if (dashboard.extracted) {
  console.log("\n💡 Try these commands:");
  console.log(`   curl ${worker.url}`);
  console.log(`   open ${dashboard.extracted}`);
  console.log(
    "\n🔍 The dashboard is monitoring your local Worker in dev mode.",
  );
  console.log("   Changes to the Worker will trigger hot reload.");
} else {
  console.log("\n📦 Production deployment - Dashboard is not running.");
  console.log(`   Worker is live at: ${worker.url}`);
}
console.log();

await app.finalize();
