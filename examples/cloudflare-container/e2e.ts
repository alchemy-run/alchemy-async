import { fetchAndExpectOK } from "alchemy/util";
import assert from "node:assert";

export async function test({ url }: { url: string | undefined }) {
  console.log("Running container E2E test...");

  assert(url, "URL is not set");

  await pollUntilReady(url);

  const id = crypto.randomUUID();
  const res = await fetchAndExpectOK(`${url}/container/${id}`);
  assert.equal(
    res.status,
    200,
    `Unexpected status from /container/${id}: ${res.status}`,
  );
  const text = await res.text();
  assert(
    text.startsWith(
      `Hi, I'm a container and this is my message: "I was passed in via the container class!", my instance ID is:`,
    ),
    `Unexpected response from /container/${id}: ${text}`,
  );

  console.log("Container E2E test passed");
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
