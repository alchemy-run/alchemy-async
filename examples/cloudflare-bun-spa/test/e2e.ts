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

  await pollUntilReady(url);
  // This is true for local dev tests but not for remote e2e tests
  console.error(
    "ALCHEMY_TEST_KILL_ON_FINALIZE",
    process.env.ALCHEMY_TEST_KILL_ON_FINALIZE,
  );
  if (process.env.ALCHEMY_TEST_KILL_ON_FINALIZE) {
    console.error("Polling for apiUrl", apiUrl);
    await pollUntilReady(apiUrl, 404);
  } else {
    // In dev the apiUrl should return 404 on the base path
    // in production deployments
    await pollUntilReady(apiUrl);
  }

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

  const websiteHtmlFound = await fetchAndExpectOK(url, undefined, 200);
  assert.equal(websiteHtmlFound.status, 200, "Website HTML is not found");
  assert.equal(
    await websiteHtmlFound.headers.get("content-type")?.startsWith("text/html"),
    true,
    "Website HTML header is not correct",
  );

  const aboutPageFound = await fetchAndExpectOK(`${url}/about`, undefined, 200);
  assert.equal(aboutPageFound.status, 200, "About page is not found");
  assert.equal(
    await aboutPageFound.headers.get("content-type")?.startsWith("text/html"),
    true,
    "About page header is not correct",
  );
  const aboutContent = await aboutPageFound.text();
  assert(
    aboutContent.includes("About Bun + React + TS"),
    "About page content is not correct",
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
