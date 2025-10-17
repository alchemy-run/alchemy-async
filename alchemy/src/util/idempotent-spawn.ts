import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "pathe";
import { AsyncMutex } from "./mutex.ts";

export interface IdempotentSpawnOptions {
  cmd: string;
  cwd?: string;
  env?: Record<string, string>;
  log: string;
  stateFile?: string;
  overlapBytes?: number;
  resume?: boolean;
  isSameProcess?: (pid: number) => Promise<boolean>;
  processName?: string;
  extract?: (line: string) => string | undefined;
  /**
   * If true, the child's stdout and stderr will not be mirrored to this process's console.
   */
  quiet?: boolean;
}

/**
 * Idempotently ensure a long-lived child is running with stdout/stderr -> files,
 * and mirror those logs to THIS process's console with persisted offsets.
 *
 * Use: await ensureLoggedChildAndMirror({ cmd: "vite dev" })
 */
export async function idempotentSpawn({
  cmd,
  cwd,
  env,
  stateFile = "state.json",
  overlapBytes = 0,
  resume = false,
  log = "log.txt",
  processName,
  extract,
  isSameProcess,
  quiet = false,
}: IdempotentSpawnOptions): Promise<{
  extracted: Promise<string | undefined>;
  stop: () => Promise<void>;
}> {
  if (!processName && !isSameProcess) {
    processName = cmd.split(" ")[0];
  }

  const outPath = log;
  await Promise.all([
    fsp.mkdir(path.dirname(stateFile), { recursive: true }),
    fsp.mkdir(path.dirname(log), { recursive: true }),
  ]);

  const { promise: extracted, resolve: resolveExtracted } =
    Promise.withResolvers<string | undefined>();

  if (!extract) {
    resolveExtracted(undefined);
  }

  const pid = await ensureChildRunning();

  const write = quiet
    ? () => false
    : (buf: Buffer) => process.stdout.write(buf);

  // Start followers (stdout/stderr) and mirror to this process
  await followFilePersisted(outPath, {
    stateKey: `${path.resolve(outPath)}::stdout`,
    write,
  });

  return {
    extracted,
    stop: async () => (pid ? await kill(pid) : undefined),
  };

  function isPidAlive(pid: number) {
    if (!pid || Number.isNaN(pid)) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  async function writeJsonAtomic(file: string, data: any) {
    const dir = path.dirname(file);
    const tmp = path.join(
      dir,
      `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`,
    );
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await fsp.rename(tmp, file); // atomic on POSIX
  }

  async function readJson(file: string) {
    try {
      return JSON.parse(await fsp.readFile(file, "utf8"));
    } catch {
      return undefined;
    }
  }

  async function spawnLoggedChild() {
    const out = await fsp.open(outPath, "a");

    // shell:true, NO args — pass a single command string
    const child = spawn(cmd, {
      shell: true,
      cwd,
      stdio: ["inherit", out.fd, out.fd], // stdout/stderr -> files (OS-level)
      env,
      detached: false,
    });

    // Child now owns dup'd fds; close our handles.
    await out.close();

    // Persist PID into the shared state file
    const stateAll = (await readJson(stateFile)) ?? {};
    stateAll.pid = child.pid;
    await writeJsonAtomic(stateFile, stateAll);
    return child;
  }

  async function ensureChildRunning() {
    const stateAll = await readJson(stateFile);
    if (stateAll) {
      const pid = Number.parseInt(stateAll.pid, 10);
      if (isPidAlive(pid)) return pid;
      if (await isSameProcess?.(pid)) return pid;
      if (processName) {
        const processes = await find("pid", pid);
        if (processes.length > 1) {
          console.warn(
            `Found multiple processes with PID ${pid}, using the first one`,
          );
        }
        if (processes.length > 0) {
          if (processes[0].name.startsWith(processName)) {
            return pid;
          }
        }
      }
    }
    // not running, let's clear pid and state
    await Promise.all([
      fsp.rm(stateFile).catch(() => {}),
      fsp.rm(log).catch(() => {}),
    ]);
    return (await spawnLoggedChild()).pid;
  }

  // Follow a file from persisted offset and mirror to a sink (stdout/stderr)
  async function followFilePersisted(
    logPath: string,
    { write, chunkSize = 64 * 1024, tickMs = 100 }: {
      stateKey: string;
      write: (buf: Buffer) => boolean;
      chunkSize?: number;
      tickMs?: number;
    },
  ) {
    logPath = path.resolve(logPath);
    let state = (await readJson(stateFile)) ?? {};

    let fh = await fsp.open(logPath, "r");
    let st = await fh.stat();
    let ino = Number(st.ino ?? 0);
    let dev = Number(st.dev ?? 0);

    // Resume policy: if resume is enabled and same file, start at saved offset (with overlap); else start from end.
    let offset =
      resume &&
      state.ino === ino &&
      state.dev === dev &&
      typeof state.offset === "number"
        ? Math.max(0, Math.min(st.size, state.offset - overlapBytes))
        : st.size;

    let closed = false;
    const drainMutex = new AsyncMutex();

    // we read the log file and stream in chunks, not lines
    // so we need to keep track of the remainder of the last line
    let remainder: string | undefined;

    // if we are resuming, then re-parse the log lines to extract the value
    if (offset > 0) {
      // read from start to offset
      const fullBuffer = Buffer.allocUnsafe(offset);
      await fh.read({
        position: 0,
        buffer: fullBuffer,
        length: offset,
      });
      const content = fullBuffer.toString("utf8");
      parse(content);
    }

    await drain();

    const watcher = fs.watch(logPath, async () => {
      if (closed) return;
      try {
        const cur = await fh.stat();
        const curIno = Number(cur.ino ?? 0);
        const curDev = Number(cur.dev ?? 0);
        if (curIno !== ino || curDev !== dev) {
          // Rotated/replaced: reopen and start at beginning of new file
          await fh.close().catch(() => {});
          fh = await fsp.open(logPath, "r");
          const cur2 = await fh.stat();
          ino = Number(cur2.ino ?? 0);
          dev = Number(cur2.dev ?? 0);
          offset = 0;
        }
      } catch {
        // File might briefly disappear during rotation
      }
      await drain();
    });

    const tick = setInterval(() => {
      drain().catch(() => {});
    }, tickMs);

    return async function stop() {
      closed = true;
      watcher.close();
      clearInterval(tick);
      await fh.close().catch(() => {});
      await persist();
    };

    async function persist() {
      try {
        const cur = await fh.stat();
        state = {
          ...state,
          offset,
          ino: Number(cur.ino ?? ino),
          dev: Number(cur.dev ?? dev),
          size: cur.size,
          mtimeMs: cur.mtimeMs,
        };
        await writeJsonAtomic(stateFile, state);
      } catch {
        // If the file vanished mid-rotation, we'll catch up on the next event.
      }
    }

    function parse(content: string) {
      const lines = content.split("\n");
      if (extract) {
        if (lines.length > 0) {
          remainder = lines[lines.length - 1];
        }
        // parse all lines except the last one (which may be a partial line)
        for (const line of lines.slice(0, -1)) {
          const extracted = extract(line);
          if (extracted) {
            resolveExtracted(extracted);
            break;
          }
        }
      }
    }

    function drain() {
      return drainMutex.lock(async () => {
        while (true) {
          const cur = await fh.stat().catch(() => null);
          if (!cur) break;

          if (cur.size < offset) offset = 0; // truncated
          const toRead = Math.min(chunkSize, cur.size - offset);
          if (toRead <= 0) break;

          const { bytesRead, buffer } = await fh.read({
            position: offset,
            buffer: Buffer.allocUnsafe(toRead),
            length: toRead,
          });
          if (!bytesRead) break;

          const chunk = buffer.subarray(0, bytesRead);

          // write the newly read content to the stream
          write(chunk);
          // parse the previous remainder and the new chunk
          parse(`${remainder || ""}${chunk.toString("utf8")}`);
          offset += bytesRead;
        }
        await persist();
      });
    }
  }

  async function kill(pid: number) {
    // 1. Kill with SIGTERM
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      return;
    }
    // 2. Detect if it's still running.
    // The process appears to remain in the process table even after it's exited, so `isPidAlive` will return true.
    // However, if it's in the table, `find-process` will return it with a name of "<defunct>", so we can detect that instead.
    // const { default: find } = await import("find-process");
    const processes = await find("pid", pid);
    if (processes.some((p) => p.name !== "<defunct>")) {
      // 3. If it's still running, kill with SIGKILL
      try {
        process.kill(pid, "SIGKILL");
      } catch {}
    }
  }
}

/**
 * The find-process package is a bit of a mess and has different behavior across runtimes (bun, tsx, node, etc.)
 *
 * This wrapper function defensively searches for the find function in the imported module.
 *
 * It confirmed to support:
 * 1. node
 * 2. bun
 * 3. tsx
 *
 * TODO(sam): check deno?
 */
const find: typeof import("find-process").default = async (...args) => {
  const findProcess = await import("find-process");
  const find =
    (findProcess as any).default?.default ??
    (findProcess as any).default ??
    (findProcess as any).find ??
    findProcess;
  return find(...args);
};
