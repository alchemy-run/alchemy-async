import pc from "picocolors";
import { WebSocket } from "ws";
import { logger } from "../util/logger.ts";
import type { CloudflareApiResponse } from "./api-response.ts";
import type { CloudflareApi } from "./api.ts";

export const createTail = async (
  api: CloudflareApi,
  id: string,
  scriptName: string,
) => {
  const tail = new TailClient(api, id, scriptName);
  await tail.connect();
  return tail;
};

interface Tail {
  id: string;
  url: string;
  expires_at: Date;
}

const DEBUG = !!process.env.DEBUG;

class TailClient {
  private api: CloudflareApi;
  private id: string;
  private scriptName: string;

  private tail?: Tail;
  private ws?: WebSocket;
  private pingInterval?: NodeJS.Timeout;
  private clean = false;

  constructor(api: CloudflareApi, id: string, scriptName: string) {
    this.api = api;
    this.id = id;
    this.scriptName = scriptName;
  }

  private async create() {
    if (
      this.tail &&
      this.tail.expires_at > new Date(Date.now() + 1000 * 60 * 5)
    ) {
      return this.tail;
    }
    const res = await this.api.post(
      `/accounts/${this.api.accountId}/workers/scripts/${this.scriptName}/tails`,
      { filters: [] },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const json = (await res.json()) as CloudflareApiResponse<Tail>;
    if (!json.success) {
      throw new Error(
        `Failed to create tail for ${this.scriptName} (${res.status}): ${json.errors.map((e) => `${e.code} - ${e.message}`).join("\n")}`,
      );
    }
    this.tail = {
      id: json.result.id,
      url: json.result.url,
      expires_at: new Date(json.result.expires_at),
    };
    return this.tail;
  }

  async connect(attempt = 0) {
    if (this.ws) {
      throw new Error(`Tail already connected for ${this.scriptName}`);
    }
    if (attempt > 3) {
      await this.close();
      throw new Error(`Failed to connect to tail for ${this.scriptName}`);
    }
    const tail = await this.create();
    const ws = new WebSocket(tail.url, "trace-v1");
    ws.on("open", () => {
      this.ping(ws);
      if (DEBUG) {
        logger.log(`connected to tail for "${this.scriptName}"`);
      }
    });
    ws.on("close", () => {
      this.ws = undefined;
      if (DEBUG) {
        logger.log(`closed tail for "${this.scriptName}"`);
      }
      if (this.clean) {
        return;
      }
      logger.log(`reconnecting to tail for "${this.scriptName}"`);
      setTimeout(() => {
        this.connect(attempt + 1);
      }, 1000);
    });
    ws.on("error", (event) => {
      logger.error(`error on tail for "${this.scriptName}": ${event}`);
    });
    ws.on("message", (message) => {
      const data: TailEventMessage = JSON.parse(message.toString());
      const prefix = pc.blue(`[${this.id}]`);
      if (data.event && "request" in data.event) {
        // TODO: handle other event types
        const event = data.event;
        const url = new URL(event.request.url);
        const status = event.response?.status ?? 500;
        // TODO: make this look nicer
        logger.log(
          `${prefix} ${pc.gray(event.request.method)} ${url.pathname} ${pc.dim(">")} ${
            status >= 200 && status < 300 ? pc.green(status) : pc.red(status)
          } ${pc.gray(`(cpu: ${Math.round(data.cpuTime)}ms, wall: ${Math.round(data.wallTime)}ms)`)}`,
        );
      }
      for (const log of data.logs) {
        logger.log(`${prefix} ${pc.gray(log.level)} ${log.message.join(" ")}`);
      }
      for (const exception of data.exceptions) {
        const start = `${prefix} ${pc.red(exception.name)}`;
        logger.log(
          `${start} ${exception.message}\n${pc.gray(exception.stack)}`,
        );
      }
    });
  }

  private async ping(ws: WebSocket) {
    let waitingForPong = false;

    const cleanup = () => {
      if (!this.pingInterval) {
        return;
      }
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    };

    this.pingInterval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        cleanup();
        return;
      }
      if (waitingForPong) {
        ws.close();
      }
      waitingForPong = true;
      ws.ping();
    }, 10_000);

    ws.on("pong", () => {
      waitingForPong = false;
    });
  }

  async close() {
    this.clean = true;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
      this.ws = undefined;
    }
    if (this.tail) {
      const res = await this.api.delete(
        `/accounts/${this.api.accountId}/workers/scripts/${this.scriptName}/tails/${this.tail.id}`,
      );
      if (!res.ok) {
        throw new Error(
          `Failed to close tail for ${this.scriptName} (${res.status}): ${res.statusText}`,
        );
      }
      this.tail = undefined;
      if (DEBUG) {
        logger.log(`closed tail for "${this.scriptName}": ${res.status}`);
      }
    }
  }
}
interface TailEventMessage {
  wallTime: number;
  cpuTime: number;
  truncated: boolean;
  executionModel: "stateless" | "durableObject";
  outcome:
    | "ok"
    | "canceled"
    | "exception"
    | "exceededCpu"
    | "exceededMemory"
    | "unknown";
  scriptTags: string[];
  scriptVersion: { id: string };
  scriptName: string;
  diagnosticsChannelEvents: unknown[];
  exceptions: {
    name: string;
    message: string;
    stack: string;
    timestamp: string;
  }[];
  logs: {
    message: string[];
    level: string;
    timestamp: string;
  }[];
  event: TailEventMessage.Event;
}

namespace TailEventMessage {
  export type Event =
    | RequestEvent
    | ScheduledEvent
    | EmailEvent
    | QueueEvent
    | RpcEvent
    | TailEvent
    | TailInfoEvent
    | null
    | undefined;

  export interface RequestEvent {
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: string;
    };
    response?: { status: number };
  }

  export interface ScheduledEvent {
    cron: string;
    scheduledTime: string;
  }

  export interface EmailEvent {
    /**
     * Who sent the email
     */
    mailFrom: string;

    /**
     * Who was the email sent to
     */
    rcptTo: string;

    /**
     * Size of the email in bytes
     */
    rawSize: number;
  }

  /**
   * An event that was triggered for a tail receiving TailEventMessages
   * Only seen when tailing a tail worker
   */
  export interface TailEvent {
    /**
     * A minimal representation of the TailEventMessages that were delivered to the tail handler
     */
    consumedEvents: {
      /**
       * The name of script being tailed
       */
      scriptName?: string;
    }[];
  }

  /**
   * Message from tail with information about the tail itself
   */
  export interface TailInfoEvent {
    message: string;
    type: string;
  }

  export interface QueueEvent {
    queue: string;
    batchSize: number;
  }

  export interface RpcEvent {
    rpcMethod: string;
  }
}
