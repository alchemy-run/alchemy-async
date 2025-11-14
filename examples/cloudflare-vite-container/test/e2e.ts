import { fetchAndExpectOK, fetchAndExpectStatus } from "alchemy/util";
import assert from "node:assert";

export async function test({
  url,
  env,
}: {
  url: string | undefined;
  env: Record<string, string>;
}) {
  console.log("Running Vite E2E test...");

  assert(url, "URL is not set");

  await pollUntilReady(url);

  const envRes = await fetchAndExpectOK(`${url}/api/test/env`);
  assert.deepStrictEqual(
    await envRes.json(),
    env,
    "Unexpected response from /api/test/env",
  );

  const key = crypto.randomUUID();
  const value = crypto.randomUUID();

  const putRes = await fetchAndExpectStatus(
    `${url}/api/test/kv/${key}`,
    {
      method: "PUT",
      body: value,
    },
    201,
  );
  assert.equal(putRes.status, 201, "Failed to put key-value pair");

  const getRes = await fetchAndExpectOK(`${url}/api/test/kv/${key}`);
  assert.equal(getRes.status, 200, "Failed to get key-value pair");
  assert.equal(await getRes.text(), value, "Value is not correct");

  const deleteRes = await fetchAndExpectStatus(
    `${url}/api/test/kv/${key}`,
    {
      method: "DELETE",
    },
    204,
  );
  assert.equal(deleteRes.status, 204, "Failed to delete key-value pair");

  const getRes2 = await fetchAndExpectStatus(
    `${url}/api/test/kv/${key}`,
    undefined,
    404,
  );
  assert.equal(getRes2.status, 404, "Key-value pair is not deleted");

  console.log("Vite E2E test passed");
}

async function pollUntilReady(url: string) {
  let i = 0;
  while (true) {
    const res = await fetch(url);
    if (res.ok) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    i++;
    if (i > 30) {
      throw new Error(
        `Worker is not ready after 30 seconds (status: ${res.status}): ${url}`,
      );
    }
  }
}
