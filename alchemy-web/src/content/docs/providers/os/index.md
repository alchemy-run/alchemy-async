---
title: OS Provider
description: Execute commands and run development scripts using Alchemy's OS provider
---

The OS provider enables you to execute shell commands and run long-lived development processes as part of your Alchemy infrastructure. Whether you need to run build commands, manage development servers, or integrate with local tooling, the OS provider brings operating system operations into your infrastructure as code.

## Resources

The OS provider includes the following resources:

- [Exec](/providers/os/exec/) - Execute shell commands with full lifecycle management
- [DevScript](/providers/os/dev-script/) - Run long-lived development scripts with restart policies and readiness detection

## Example

Here's a complete example using the OS provider to build a project and run development services:

```typescript
import { Exec, DevScript } from "alchemy/os";
import { Worker } from "alchemy/cloudflare";
import alchemy from "alchemy";

const app = await alchemy("my-app");

// Run a build command with memoization
const build = await Exec("build", {
  command: "bun run build",
  memoize: {
    patterns: ["./src/**"],
  },
});

// Deploy a Cloudflare Worker
const worker = await Worker("api", {
  entrypoint: "./dist/worker.js",
});

// Start a development dashboard that monitors the worker
const dashboard = await DevScript("dashboard", {
  script: `bun run dashboard --api-url ${worker.url}`,
  extract: (line) => line.match(/Dashboard running at (http:\/\/[^\s]+)/)?.[1],
  env: {
    NODE_ENV: "development",
    API_KEY: alchemy.secret.env.API_KEY,
  },
});

console.log("Worker URL:", worker.url);
console.log("Dashboard URL:", dashboard.extracted);

await app.finalize();
```

## Key Features

### Command Execution (Exec)

The Exec resource provides:
- **Command memoization** - Cache results and skip re-execution when inputs haven't changed
- **File-based memoization** - Re-run commands only when specified files change
- **Secret handling** - Securely pass sensitive values as environment variables
- **Working directory control** - Run commands in any directory
- **Output capture** - Capture stdout/stderr for processing

Perfect for:
- Build commands (`vite build`, `tsc`, `webpack`)
- Database migrations (`drizzle-kit push`, `prisma migrate`)
- Code generation (`graphql-codegen`, `openapi-generator`)
- Testing (`vitest`, `jest`, `playwright`)

### Development Scripts (DevScript)

The DevScript resource provides:
- **Local-only execution** - Only runs in `alchemy dev` mode (no-op in production)
- **Readiness detection** - Wait for URL or pattern in output before proceeding
- **Restart policies** - Control when processes restart on configuration changes
- **Lifecycle management** - Automatic start/stop with graceful shutdown
- **Log management** - Persistent logs at `.alchemy/logs/<id>.log`
- **PID tracking** - Process state at `.alchemy/pids/<id>.pid.json`

Perfect for:
- Development servers (`vite dev`, `next dev`, `bun --hot`)
- Local dashboards and monitoring tools
- Database servers (`docker-compose up postgres`)
- Background workers and task runners
- Integration testing environments

## Common Patterns

### Build Then Deploy

Execute build commands before deployment:

```typescript
import { Exec } from "alchemy/os";
import { Worker } from "alchemy/cloudflare";

// Build the project
const build = await Exec("build", {
  command: "bun run build",
  memoize: {
    patterns: ["./src/**"],
  },
});

// Deploy using the build output
const worker = await Worker("api", {
  entrypoint: "./dist/worker.js",
});
```

### Multi-Service Development

Run multiple services together in development:

```typescript
import { DevScript } from "alchemy/os";

const database = await DevScript("database", {
  script: "docker-compose up postgres",
  extract: (line) => line.match(/database system is ready/)?.[0],
});

const backend = await DevScript("backend", {
  script: "bun run dev",
  env: {
    DATABASE_URL: "postgresql://localhost:5432/myapp",
  },
  extract: (line) => line.match(/http:\/\/localhost:3001/)?.[0],
});

const frontend = await DevScript("frontend", {
  script: `bun run dev --api ${backend.extracted}`,
  extract: (line) => line.match(/http:\/\/localhost:3000/)?.[0],
});
```

### Secret Management

Securely pass secrets to commands:

```typescript
import { Exec } from "alchemy/os";
import alchemy from "alchemy";

const deploy = await Exec("deploy", {
  command: "npm run deploy",
  env: {
    DATABASE_URL: alchemy.secret.env.DATABASE_URL,
    API_KEY: alchemy.secret.env.API_KEY,
  },
});
```

### Conditional Memoization

Optimize for development while ensuring fresh builds in CI:

```typescript
import { Exec } from "alchemy/os";

const build = await Exec("build", {
  command: "vite build",
  // Memoize in development, always run in CI
  memoize: process.env.CI ? false : {
    patterns: ["./src/**", "./public/**"],
  },
});
```

## Cross-Platform Compatibility

### Shell Execution

Commands run in the system shell:
- **macOS/Linux**: bash/sh
- **Windows**: cmd.exe or PowerShell

For cross-platform compatibility:
1. Use portable tools like `bun`, `node`, or `npm`
2. Keep commands simple
3. Test on target platforms

### Path Separators

Use `pathe` or Node's `path` module for cross-platform paths:

```typescript
import { join } from "pathe";
import { Exec } from "alchemy/os";

const build = await Exec("build", {
  command: "bun run build",
  cwd: join(".", "packages", "frontend"),
});
```

## Best Practices

### Use Memoization Wisely

Memoization improves performance but can cause issues with build outputs:

```typescript
// ✅ Good: Disable memoization for build outputs in CI
const build = await Exec("build", {
  command: "vite build",
  memoize: process.env.CI ? false : {
    patterns: ["./src/**"],
  },
});

// ❌ Avoid: Always memoizing builds can cause stale outputs
const build = await Exec("build", {
  command: "vite build",
  memoize: true, // Build outputs won't be produced if memoized
});
```

### Choose the Right Resource

| Use Case | Resource | Why |
|----------|----------|-----|
| One-time commands | `Exec` | Runs once, completes, returns output |
| Build commands | `Exec` | Runs during deployment, produces artifacts |
| Long-running dev servers | `DevScript` | Stays alive, manages lifecycle |
| Local development tools | `DevScript` | Only runs in dev mode |
| Database migrations | `Exec` | Idempotent, runs each deployment |
| Background workers (dev) | `DevScript` | Runs alongside dev, auto-restarts |

### Working with Logs

Both resources write logs that you can access:

```bash
# Tail DevScript logs
tail -f .alchemy/logs/my-script.log

# Check Exec output in state
cat .alchemy/app/dev/exec-id.json
```

### Graceful Shutdown

DevScript uses graceful shutdown:
1. Send SIGTERM (allows cleanup)
2. Wait 100ms
3. Send SIGKILL if still running

Ensure your scripts handle SIGTERM for proper cleanup:

```javascript
// In your dev script
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, cleaning up...');
  // Close connections, flush buffers, etc.
  process.exit(0);
});
```

## Local Development

### DevScript and `alchemy dev`

DevScript is designed specifically for `alchemy dev`:

```bash
# DevScript resources run
alchemy dev

# DevScript resources return metadata only (no-op)
alchemy deploy
```

This ensures development tools don't run in production.

### Hot Reloading

DevScript delegates hot reloading to your tools:

- **Bun**: `bun --hot` or `bun --watch`
- **Nodemon**: File watching

DevScript's restart policies control when the entire process restarts, not file-level hot reloading.

## Debugging

### Check Logs

```bash
# DevScript logs
tail -f .alchemy/logs/<id>.log

# Check PID state
cat .alchemy/pids/<id>.pid.json
```

### Enable Debug Output

Remove `quiet: true` to see output in your terminal:

```typescript
const script = await DevScript("debug", {
  script: "bun run dev",
  // quiet: false, // Default - output visible
});
```

### Extraction Timeouts

If extraction times out, the error includes:
- Log file path
- Last 20 lines of output
- Timeout duration

Use this information to:
1. Check if the pattern matches actual output
2. Increase timeout if needed
3. Fix issues preventing the pattern from appearing

## Additional Resources

- [Exec Resource Documentation](/providers/os/exec/)
- [DevScript Resource Documentation](/providers/os/dev-script/)
- [Alchemy Secrets Guide](/guides/secrets/)

