import { Cloudflare } from "cloudflare";
import { createCloudflareApi } from "../alchemy/src/cloudflare/api.ts";
import { putWorker } from "../alchemy/src/cloudflare/worker.ts";

const _api = await createCloudflareApi();
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
const api = new Cloudflare({
  apiKey: process.env.CLOUDFLARE_API_KEY!,
  apiEmail: process.env.CLOUDFLARE_EMAIL!,
});

const allWorkers = (
  await Array.fromAsync(
    (
      await api.workers.scripts.list({
        account_id: accountId,
      })
    ).iterPages(),
  )
)
  .flatMap((page) => page.result)
  .filter((worker) => !worker.id!.startsWith("alchemy-"))
  .map((worker) => worker.id!);

const namespaces = (
  await Array.fromAsync(
    (
      await api.workersForPlatforms.dispatch.namespaces.list({
        account_id: accountId,
      })
    ).iterPages(),
  )
).flatMap((page) => page.result);

const workflows = (
  await Array.fromAsync(
    (
      await api.workflows.list({
        account_id: accountId,
      })
    ).iterPages(),
  )
).flatMap((page) => page.result);

const allQueues = (
  await Array.fromAsync(
    (await api.queues.list({ account_id: accountId })).iterPages(),
  )
).flatMap((page) => page.result);

console.log("Remaining workers: ", allWorkers.length);
console.log("Remaining namespaces: ", namespaces.length);
console.log("Remaining workflows: ", workflows.length);

if (process.argv.includes("--delete")) {
  await deleteNamespaces();
  await deleteWorkflows();
  await stubBindings();
  await deleteQueues();
  await deleteWorkers();
}

async function deleteNamespaces() {
  await Promise.all(
    namespaces.map(async (ns) => {
      await api.workersForPlatforms.dispatch.namespaces.delete(
        ns.namespace_name!,
        {
          account_id: accountId,
        },
      );
    }),
  );
}

async function deleteWorkflows() {
  await Promise.all(
    workflows.map(async (workflow) => {
      await api.workflows.delete(workflow.name!, {
        account_id: accountId,
      });
    }),
  );
}

async function stubBindings() {
  await Promise.all(
    allWorkers
      .sort()
      .filter((worker) => !worker.startsWith("alchemy-"))
      .map((worker) => worker.replace(":", "%3A"))
      .map(async (worker) => {
        try {
          await putWorker(_api, {
            workerName: worker,
            scriptBundle: {
              entrypoint: "worker.js",
              modules: [
                {
                  path: "worker.js",
                  type: "esm",
                  content:
                    "export default { queue() {}, fetch() { return new Response('Hello, world!') } }",
                },
              ],
            },
            compatibilityDate: "2025-09-13",
            compatibilityFlags: ["nodejs_compat"],
          });
          await api.workers.scripts.delete(worker, {
            account_id: accountId,
            force: true,
          });
        } catch (error) {
          console.error("Error deleting worker: ", worker, error.message);
        }
      }),
  );
}

async function deleteWorkers() {
  await Promise.all(
    allWorkers.map(async (worker) => {
      await api.workers.scripts.delete(worker, {
        account_id: accountId,
        force: true,
      });
    }),
  );
}

async function deleteQueues() {
  await Promise.all(
    allQueues.map(async (queue) => {
      await Promise.all(
        queue.consumers?.map(async (consumer) => {
          await api.queues.consumers.delete(
            queue.queue_id!,
            consumer.consumer_id!,
            {
              account_id: accountId,
            },
          );
        }) ?? [],
      );
      await api.queues.delete(queue.queue_id!, {
        account_id: accountId,
      });
    }),
  );
}
