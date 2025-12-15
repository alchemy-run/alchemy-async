import fs from "node:fs/promises";
import os from "node:os";
import path from "pathe";
import lockfile from "proper-lockfile";

const LOCK_DIR = path.join(os.homedir(), ".alchemy", "lock");

export class Lock {
  private path: string;
  constructor(key: string) {
    this.path = path.join(LOCK_DIR, encodeURIComponent(key));
  }

  /**
   * Acquires the lock.
   * @returns A function to release the lock, or null if the lock is already acquired.
   */
  async acquire() {
    try {
      await fs.mkdir(LOCK_DIR, { recursive: true });
      return await lockfile.lock(LOCK_DIR, {
        lockfilePath: this.path,
      });
    } catch {
      return null;
    }
  }

  /**
   * Checks if the lock is active.
   * @returns True if the lock is active, false otherwise.
   */
  async check() {
    return await lockfile.check(LOCK_DIR, {
      lockfilePath: this.path,
    });
  }

  /**
   * Waits for the lock to be released.
   * @param interval The interval to wait between checks.
   */
  async wait(interval = 100) {
    while (await this.check()) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}
