import { fetchAndExpectOK, fetchAndExpectStatus } from "alchemy/util";
import assert from "node:assert";

export async function test({
  url,
  apiUrl,
  env,
}: {
  url: string;
  apiUrl: string;
  env: Record<string, string>;
}) {
  console.log("Running Vite E2E test...");

  assert(url, "URL is not set");

  await Promise.all([pollUntilReady(url), pollUntilReady(apiUrl, 404)]);

  const envRes = await fetchAndExpectOK(`${apiUrl}/api/test/env`);
  assert.deepStrictEqual(
    await envRes.json(),
    env,
    "Unexpected response from /api/test/env",
  );

  const key = crypto.randomUUID();
  const value = crypto.randomUUID();

  const putRes = await fetchAndExpectStatus(
    `${apiUrl}/api/test/kv/${key}`,
    {
      method: "PUT",
      body: value,
    },
    201,
  );
  assert.equal(putRes.status, 201, "Failed to put key-value pair");

  const getRes = await fetchAndExpectOK(`${apiUrl}/api/test/kv/${key}`);
  assert.equal(getRes.status, 200, "Failed to get key-value pair");
  assert.equal(await getRes.text(), value, "Value is not correct");

  const deleteRes = await fetchAndExpectStatus(
    `${apiUrl}/api/test/kv/${key}`,
    {
      method: "DELETE",
    },
    204,
  );
  assert.equal(deleteRes.status, 204, "Failed to delete key-value pair");

  const getRes2 = await fetchAndExpectStatus(
    `${apiUrl}/api/test/kv/${key}`,
    undefined,
    404,
  );
  assert.equal(getRes2.status, 404, "Key-value pair is not deleted");

  const websiteHtmlFound = await fetchAndExpectOK(url, undefined, 200);
  assert.equal(websiteHtmlFound.status, 200, "Website HTML is not found");
  assert.equal(
    await websiteHtmlFound.headers.get("content-type"),
    "text/html;charset=utf-8",
    "Website HTML header is not correct",
  );

  console.log("Vite E2E test passed");
}

async function pollUntilReady(url: string, expectedStatus?: number) {
  let i = 0;
  while (true) {
    const res = await fetch(url);
    if (expectedStatus) {
      if (res.status === expectedStatus) {
        break;
      }
    } else {
      if (res.ok) {
        break;
      }
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
