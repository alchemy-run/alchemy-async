import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { Workflow } from "../../src/cloudflare/workflow.ts";
import { destroy } from "../../src/destroy.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});
const api = await createCloudflareApi();

// Helper function to create client worker scripts
function createClientWorkerScript(
  clientWorkerName: string,
  endpointPath: string,
  workflowBindingName: string,
  errorMessage: string,
  params: Record<string, any>,
) {
  return `
    export default {
      async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        if (url.pathname === '/${endpointPath}') {
          try {
            // Get the shared workflow binding
            const workflow = env.${workflowBindingName};

            if (!workflow) {
              return new Response(JSON.stringify({ error: "${errorMessage}" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Create a workflow instance with parameters
            const params = ${JSON.stringify(params)};
            const instance = await workflow.create(params);

            return Response.json({
              id: instance.id,
              details: await instance.status(),
              success: true,
              clientWorker: '${clientWorkerName}',
              crossScriptWorking: true,
              params: params
            });
          } catch (error) {
            console.error("Error triggering shared workflow:", error);
            return new Response(JSON.stringify({ 
              error: error.message || "Unknown error",
              crossScriptWorking: false
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        return new Response('Workflow Client Worker is running!', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    };
  `;
}

describe("Workflow", () => {
  // Test for binding a workflow to a worker
  test("create and delete worker with workflow binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-workflow`;

    // Sample worker script with workflow handler - updated to match Cloudflare Workflows pattern
    const workflowWorkerScript = `
      import { WorkflowEntrypoint } from "cloudflare:workers";

      // Workflow definition for email notifications
      export class EmailNotifier extends WorkflowEntrypoint {
        constructor(state, env) {
          this.state = state;
          this.env = env;
        }

        async run(event, step) {
          // Process order data from event payload
          const orderDetails = await step.do('process-order', async () => {
            console.log("Processing order", event.payload);
            return {
              success: true,
              orderId: event.payload.orderId,
              message: "Order processed successfully"
            };
          });

          return orderDetails;
        }
      }

      // Workflow definition for order processing
      export class OrderProcessor extends WorkflowEntrypoint {
        constructor(state, env) {
          this.state = state;
          this.env = env;
        }

        async run(event, step) {
          // Process shipping data
          const shippingDetails = await step.do('process-shipping', async () => {
            console.log("Processing shipping", event.payload);
            return {
              success: true,
              shipmentId: event.payload.shipmentId,
              message: "Shipment scheduled successfully"
            };
          });

          return shippingDetails;
        }
      }

      export default {
        async fetch(request, env, ctx) {
          const url = new URL(request.url);

          // Add endpoints to trigger workflows for testing
          if (url.pathname === '/trigger-email-workflow') {
            try {
              // Get workflow binding
              const workflow = env.EMAIL_WORKFLOW;

              if (!workflow) {
                return new Response(JSON.stringify({ error: "No email workflow binding found" }), {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                });
              }

              // Create a workflow instance with parameters
              const params = { orderId: "test-123", amount: 99.99 };
              const instance = await workflow.create(params);

              return Response.json({
                id: instance.id,
                details: await instance.status(),
                success: true,
                orderId: params.orderId,
                message: "Order processed successfully"
              });
            } catch (error) {
              console.error("Error triggering email workflow:", error);
              return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }

          // Endpoint for the order workflow
          if (url.pathname === '/trigger-order-workflow') {
            try {
              // Get workflow binding
              const workflow = env.ORDER_WORKFLOW;

              if (!workflow) {
                return new Response(JSON.stringify({ error: "No order workflow binding found" }), {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                });
              }

              // Create a workflow instance with parameters
              const params = { shipmentId: "ship-456", carrier: "FastShip" };
              const instance = await workflow.create(params);

              return Response.json({
                id: instance.id,
                details: await instance.status(),
                success: true,
                shipmentId: params.shipmentId,
                message: "Shipment scheduled successfully"
              });
            } catch (error) {
              console.error("Error triggering order workflow:", error);
              return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }

          return new Response('Worker with workflow bindings!', { status: 200 });
        }
      };
    `;

    let worker: Worker | undefined;
    try {
      // Create a workflow instance
      const emailWorkflow = Workflow("email-notifier", {
        className: "EmailNotifier",
        workflowName: "email-notification-workflow",
      });

      // Create a worker with the workflow binding
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: workflowWorkerScript,
        format: "esm",
        bindings: {
          EMAIL_WORKFLOW: emailWorkflow,
        },
        url: true, // Enable workers.dev URL to test the workflow
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await assertWorkflowStatus("email-notification-workflow", 200);

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toBeDefined();
      expect(worker.url).toBeTruthy();

      // Test triggering the first workflow
      const response = await fetchAndExpectOK(
        `${worker.url!}/trigger-email-workflow`,
      );
      const result: any = await response.json();

      expect(response.status).toEqual(200);
      expect(result.success).toEqual(true);
      expect(result.orderId).toEqual("test-123");
      expect(result.message).toEqual("Order processed successfully");
      // Verify the instance ID is not empty
      expect(result.id).toBeTruthy();
      expect(typeof result.id).toBe("string");
      expect(result.id.length).toBeGreaterThan(0);
      // Verify the details contain valid status
      expect(result.details).toBeDefined();
      expect(result.details.status).toBeTruthy();

      // Create a new workflow binding and update the worker
      const orderWorkflow = Workflow("order-processor", {
        className: "OrderProcessor",
        workflowName: "order-processing-workflow",
      });

      // Update the worker with multiple workflow bindings
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: workflowWorkerScript,
        format: "esm",
        bindings: {
          EMAIL_WORKFLOW: emailWorkflow,
          ORDER_WORKFLOW: orderWorkflow,
        },
        url: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await assertWorkflowStatus("order-processing-workflow", 200);

      expect(worker.bindings).toBeDefined();
      expect(Object.keys(worker.bindings || {})).toHaveLength(2);

      // Test triggering the second workflow
      const orderResponse = await fetchAndExpectOK(
        `${worker.url!}/trigger-order-workflow`,
      );
      const orderResult: any = await orderResponse.json();

      expect(orderResponse.status).toEqual(200);
      expect(orderResult.success).toEqual(true);
      expect(orderResult.shipmentId).toEqual("ship-456");
      expect(orderResult.message).toEqual("Shipment scheduled successfully");
      // Verify the instance ID is not empty
      expect(orderResult.id).toBeTruthy();
      expect(typeof orderResult.id).toBe("string");
      expect(orderResult.id.length).toBeGreaterThan(0);
      // Verify the details contain valid status
      expect(orderResult.details).toBeDefined();
      expect(orderResult.details.status).toBeTruthy();
    } finally {
      // Explicitly destroy resources since destroy: false is set
      await destroy(scope);
      await assertWorkflowStatus("email-notification-workflow", 404);
      await assertWorkflowStatus("order-processing-workflow", 404);
    }
  });

  test("create and test worker with cross-script workflow binding", async (scope) => {
    // Create names for both workers
    const workflowWorkerName = `${BRANCH_PREFIX}-workflow-provider-worker`;
    const clientWorkerName = `${BRANCH_PREFIX}-workflow-client-worker`;

    // Script for the worker that defines the workflow
    const workflowProviderWorkerScript = createWorkflowProviderScript(
      "SharedOrderProcessor",
      workflowWorkerName,
      "process-shared-order",
      { orderId: "shared-123", amount: 199.99 },
    );

    // Script for the worker that uses the cross-script workflow
    const clientWorkerScript = createClientWorkerScript(
      clientWorkerName,
      "trigger-shared-workflow",
      "SHARED_ORDER_WORKFLOW",
      "No shared workflow binding found",
      { orderId: "shared-123", amount: 199.99 },
    );

    let workflowProviderWorker;
    let clientWorker;

    try {
      // First create the worker that defines the workflow with its own binding
      workflowProviderWorker = await Worker(workflowWorkerName, {
        name: workflowWorkerName,
        adopt: true,
        script: workflowProviderWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Create a workflow for the provider worker
          SHARED_ORDER_WORKFLOW: Workflow("shared-order-processor", {
            className: "SharedOrderProcessor",
            workflowName: "shared-order-processing-workflow",
            // No scriptName means it binds to its own script
          }),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(workflowProviderWorker.id).toBeTruthy();
      expect(workflowProviderWorker.name).toEqual(workflowWorkerName);
      expect(workflowProviderWorker.url).toBeTruthy();

      // Create the client worker with the cross-script workflow binding
      clientWorker = await Worker(clientWorkerName, {
        name: clientWorkerName,
        adopt: true,
        script: clientWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Create a cross-script workflow binding using the same workflow details but with scriptName
          SHARED_ORDER_WORKFLOW: Workflow("shared-order-processor", {
            className: "SharedOrderProcessor",
            workflowName: "shared-order-processing-workflow",
            scriptName: workflowWorkerName, // This makes it cross-script
          }),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(clientWorker.id).toBeTruthy();
      expect(clientWorker.name).toEqual(clientWorkerName);
      expect(clientWorker.url).toBeTruthy();
      expect(clientWorker.bindings?.SHARED_ORDER_WORKFLOW).toBeDefined();

      // Verify the binding configuration
      const binding = clientWorker.bindings.SHARED_ORDER_WORKFLOW;
      expect(binding.className).toEqual("SharedOrderProcessor");
      expect(binding.scriptName).toEqual(workflowWorkerName);

      // Test that both workers respond to basic requests
      const workflowProviderResponse = await fetchAndExpectOK(
        workflowProviderWorker.url!,
      );
      const workflowProviderText = await workflowProviderResponse.text();
      expect(workflowProviderText).toEqual(
        "Workflow Provider Worker is running!",
      );

      const clientResponse = await fetchAndExpectOK(clientWorker.url!);
      const clientText = await clientResponse.text();
      expect(clientText).toEqual("Workflow Client Worker is running!");

      // Test cross-script workflow functionality
      const triggerResponse = await fetchAndExpectOK(
        `${clientWorker.url}/trigger-shared-workflow`,
      );
      const triggerData: any = await triggerResponse.json();

      expect(triggerData).toMatchObject({
        success: true,
        clientWorker: clientWorkerName,
        crossScriptWorking: true,
        params: {
          orderId: "shared-123",
          amount: 199.99,
        },
      });

      // Verify the instance ID is not empty
      expect(triggerData.id).toBeTruthy();
      expect(typeof triggerData.id).toBe("string");
      expect(triggerData.id.length).toBeGreaterThan(0);
      // Verify the details contain valid status
      expect(triggerData.details).toBeDefined();
      expect(triggerData.details.status).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  }, 120000); // Increased timeout for cross-script workflow operations

  test("create and test worker with cross-script workflow binding using re-exported syntax", async (scope) => {
    // Create names for both workers
    const workflowWorkerName = `${BRANCH_PREFIX}-workflow-provider-worker-re-exported`;
    const clientWorkerName = `${BRANCH_PREFIX}-workflow-client-worker-re-exported`;

    // Script for the worker that defines the workflow
    const workflowProviderWorkerScript = createWorkflowProviderScript(
      "SharedNotificationProcessor",
      workflowWorkerName,
      "process-shared-notification",
      { notificationId: "notif-456", recipient: "user@example.com" },
    );

    // Script for the worker that uses the cross-script workflow
    const clientWorkerScript = createClientWorkerScript(
      clientWorkerName,
      "trigger-shared-notification",
      "SHARED_NOTIFICATION_WORKFLOW",
      "No shared notification workflow binding found",
      { notificationId: "notif-456", recipient: "user@example.com" },
    );

    let workflowProviderWorker;
    let clientWorker;

    try {
      // First create the worker that defines the workflow with its own binding
      workflowProviderWorker = await Worker(workflowWorkerName, {
        name: workflowWorkerName,
        adopt: true,
        script: workflowProviderWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Create a workflow for the provider worker
          SHARED_NOTIFICATION_WORKFLOW: Workflow(
            "shared-notification-processor",
            {
              className: "SharedNotificationProcessor",
              workflowName: "shared-notification-processing-workflow",
              // No scriptName means it binds to its own script
            },
          ),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(workflowProviderWorker.id).toBeTruthy();
      expect(workflowProviderWorker.name).toEqual(workflowWorkerName);
      expect(workflowProviderWorker.url).toBeTruthy();

      expect(
        workflowProviderWorker.bindings.SHARED_NOTIFICATION_WORKFLOW.scriptName,
      ).toEqual(workflowWorkerName);

      // Create the client worker with the cross-script workflow binding using re-exported syntax
      clientWorker = await Worker(clientWorkerName, {
        name: clientWorkerName,
        adopt: true,
        script: clientWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Use the workflow binding from the first worker directly
          SHARED_NOTIFICATION_WORKFLOW:
            workflowProviderWorker.bindings.SHARED_NOTIFICATION_WORKFLOW,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(clientWorker.id).toBeTruthy();
      expect(clientWorker.name).toEqual(clientWorkerName);
      expect(clientWorker.url).toBeTruthy();
      expect(clientWorker.bindings?.SHARED_NOTIFICATION_WORKFLOW).toBeDefined();

      // Verify the binding configuration
      const binding = clientWorker.bindings.SHARED_NOTIFICATION_WORKFLOW;
      expect(binding.className).toEqual("SharedNotificationProcessor");
      expect(binding.scriptName).toEqual(workflowWorkerName);

      // Test that both workers respond to basic requests
      const workflowProviderResponse = await fetchAndExpectOK(
        workflowProviderWorker.url!,
      );
      const workflowProviderText = await workflowProviderResponse.text();
      expect(workflowProviderText).toEqual(
        "Workflow Provider Worker is running!",
      );

      const clientResponse = await fetchAndExpectOK(clientWorker.url!);
      const clientText = await clientResponse.text();
      expect(clientText).toEqual("Workflow Client Worker is running!");

      // Test cross-script workflow functionality
      const triggerResponse = await fetchAndExpectOK(
        `${clientWorker.url}/trigger-shared-notification`,
      );
      const triggerData: any = await triggerResponse.json();

      expect(triggerData).toMatchObject({
        success: true,
        clientWorker: clientWorkerName,
        crossScriptWorking: true,
        params: {
          notificationId: "notif-456",
          recipient: "user@example.com",
        },
      });

      // Verify the instance ID is not empty
      expect(triggerData.id).toBeTruthy();
      expect(typeof triggerData.id).toBe("string");
      expect(triggerData.id.length).toBeGreaterThan(0);
      // Verify the details contain valid status
      expect(triggerData.details).toBeDefined();
      expect(triggerData.details.status).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  }, 120000); // Increased timeout for cross-script workflow operations
});

// Helper function to create workflow provider worker scripts
function createWorkflowProviderScript(
  className: string,
  workerName: string,
  stepName: string,
  resultFields: Record<string, any>,
) {
  return `
      import { WorkflowEntrypoint } from "cloudflare:workers";

      // Shared workflow definition for ${stepName}
      export class ${className} extends WorkflowEntrypoint {
        constructor(state, env) {
          this.state = state;
          this.env = env;
        }
  
        async run(event, step) {
          // Process ${stepName} data from event payload
          const details = await step.do('${stepName}', async () => {
            console.log("Processing ${stepName}", event.payload);
            return {
              success: true,
              ${Object.entries(resultFields)
                .map(([key, value]) =>
                  typeof value === "string"
                    ? `${key}: event.payload.${key}`
                    : `${key}: ${JSON.stringify(value)}`,
                )
                .join(",\n            ")},
              worker: '${workerName}',
              message: "${stepName.charAt(0).toUpperCase() + stepName.slice(1)} processed successfully"
            };
          });
  
          return details;
        }
      }
  
      export default {
        async fetch(request, env, ctx) {
          return new Response('Workflow Provider Worker is running!', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `;
}

async function assertWorkflowStatus(workflowName: string, statusCode: number) {
  const response = await api.get(
    `/accounts/${api.accountId}/workflows/${workflowName}`,
  );
  expect(response.status).toEqual(statusCode);
}
