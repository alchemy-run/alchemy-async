import assert from "node:assert";
import { poll } from "../../alchemy/src/util/poll";

export async function test(url: string) {
  assert(url, "URL is not set");
  const res = await poll({
    description: "wait for worker to be ready",
    fn: () => fetch(url),
    predicate: (res) => res.ok,
  });
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "Hello, World!");
}
