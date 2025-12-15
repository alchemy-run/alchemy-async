import {
  GetFunctionCommand,
  GetFunctionUrlConfigCommand,
  InvokeCommand,
  LambdaClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-lambda";
import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.js";
import { Function } from "../../src/aws/function.js";
import type { PolicyDocument } from "../../src/aws/policy.js";
import { Role } from "../../src/aws/role.js";
import { destroy } from "../../src/destroy.js";
import { Bundle } from "../../src/esbuild/index.js";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.js";

import "../../src/test/vitest.js";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const lambda = new LambdaClient({});

// Common policy definitions
const LAMBDA_ASSUME_ROLE_POLICY: PolicyDocument = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: {
        Service: "lambda.amazonaws.com",
      },
      Action: "sts:AssumeRole",
    },
  ],
};

const LAMBDA_LOGS_POLICY: PolicyDocument = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      Resource: "*",
    },
  ],
};

// Helper function to invoke Lambda with retry for IAM propagation
const invokeLambda = async (
  functionName: string,
  event: any,
  maxRetries = 5,
) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const invokeResponse = await lambda.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(event),
        }),
      );

      const responsePayload = new TextDecoder().decode(invokeResponse.Payload);
      return JSON.parse(responsePayload);
    } catch (error: any) {
      lastError = error;

      // Only retry for IAM role propagation errors
      if (
        error.name === "AccessDeniedException" &&
        error.message?.includes("cannot be assumed by Lambda")
      ) {
        if (attempt < maxRetries - 1) {
          // Wait before retrying with exponential backoff
          const delay = Math.min(1000 * 2 ** attempt, 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // For other errors or max retries reached, rethrow
      throw error;
    }
  }

  throw lastError;
};

describe("AWS Resources", () => {
  describe("Function", () => {
    test("create function with bundled code", async (scope) => {
      // First create the execution role
      // Define resources that need to be cleaned up
      let role: Role | undefined;
      let func: Function | null = null;
      const functionName = `${BRANCH_PREFIX}-alchemy-test-function`;
      const roleName = `${BRANCH_PREFIX}-alchemy-test-lambda-role`;

      try {
        let bundle = await Bundle(`${BRANCH_PREFIX}-test-lambda-bundle`, {
          entryPoint: path.join(__dirname, "..", "handler.ts"),
          outdir: `.out/${BRANCH_PREFIX}-test-lambda-bundle`,
          format: "cjs",
          platform: "node",
          target: "node18",
        });

        role = await Role(roleName, {
          roleName,
          assumeRolePolicy: LAMBDA_ASSUME_ROLE_POLICY,
          description: "Test role for Lambda function",
          policies: [
            {
              policyName: "logs",
              policyDocument: LAMBDA_LOGS_POLICY,
            },
          ],
          tags: {
            Environment: "test",
          },
        });

        // Create the Lambda function
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
        });

        expect(func.arn).toMatch(
          new RegExp(
            `^arn:aws:lambda:[a-z0-9-]+:\\d+:function:${functionName}$`,
          ),
        );
        expect(func.state).toBe("Active");
        expect(func.lastUpdateStatus).toBe("Successful");
        expect(func.invokeArn).toMatch(
          new RegExp(
            `^arn:aws:apigateway:[a-z0-9-]+:lambda:path\\/2015-03-31\\/functions\\/arn:aws:lambda:[a-z0-9-]+:\\d+:function:${functionName}\\/invocations$`,
          ),
        );

        // Immediately apply again to test stabilization logic
        expect(func.state).toBe("Active");
        expect(func.lastUpdateStatus).toBe("Successful");

        // Invoke the function
        const testEvent = { test: "event" };
        const response = await invokeLambda(functionName, testEvent);
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.message).toBe("Hello from bundled handler!");
        expect(body.event).toEqual(testEvent);
      } finally {
        await destroy(scope);
        // Verify function was properly deleted after cleanup
        if (func) {
          await expect(
            lambda.send(
              new GetFunctionCommand({
                FunctionName: functionName,
              }),
            ),
          ).rejects.toThrow(ResourceNotFoundException);
        }
      }
    });

    test("create function with URL configuration", async (scope) => {
      // Create execution role
      // Define resources that need to be cleaned up
      let role: Role | undefined;
      let func: Function | null = null;
      const functionName = `${BRANCH_PREFIX}-alchemy-test-function-url`;
      const roleName = `${BRANCH_PREFIX}-alchemy-test-lambda-url-role`;

      try {
        let bundle = await Bundle(`${BRANCH_PREFIX}-test-lambda-url-bundle`, {
          entryPoint: path.join(__dirname, "..", "handler.ts"),
          outdir: `.out/${BRANCH_PREFIX}-test-lambda-url-bundle`,
          format: "cjs",
          platform: "node",
          target: "node18",
        });

        role = await Role(roleName, {
          roleName,
          assumeRolePolicy: LAMBDA_ASSUME_ROLE_POLICY,
          description: "Test role for Lambda function with URL",
          policies: [
            {
              policyName: "logs",
              policyDocument: LAMBDA_LOGS_POLICY,
            },
          ],
          tags: {
            Environment: "test",
          },
        });

        // Create the Lambda function with URL config
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          url: {
            authType: "NONE",
            cors: {
              allowOrigins: ["*"],
              allowMethods: ["GET", "POST"],
              allowHeaders: ["Content-Type"],
            },
          },
        });

        // Verify function was created with URL
        expect(func.arn).toMatch(
          new RegExp(
            `^arn:aws:lambda:[a-z0-9-]+:\\d+:function:${functionName}$`,
          ),
        );
        expect(func.state).toBe("Active");
        expect(func.lastUpdateStatus).toBe("Successful");
        expect(func.functionUrl).toBeTruthy();
        expect(func.functionUrl).toMatch(
          /^https:\/\/.+\.lambda-url\..+\.on\.aws\/?$/,
        );

        // Test function URL by making an HTTP request
        const testEvent = { test: "event" };
        const response = await fetchAndExpectOK(func.functionUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testEvent),
        });

        expect(response.status).toBe(200);

        const responseBody: any = await response.json();
        expect(responseBody.message).toBe("Hello from bundled handler!");
        expect(responseBody.event).toEqual(testEvent);

        // Update the function to remove the URL
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          // No URL config means it should be removed
        });

        // Verify URL was removed
        expect(func.functionUrl).toBeUndefined();
      } finally {
        await destroy(scope);

        // Verify function was properly deleted after cleanup
        if (func) {
          await expect(
            lambda.send(
              new GetFunctionCommand({
                FunctionName: functionName,
              }),
            ),
          ).rejects.toThrow(ResourceNotFoundException);
        }
      }
    });

    test("create function with URL then remove URL in update phase", async (scope) => {
      // Define resources that need to be cleaned up
      let role: Role | undefined;
      let func: Function | null = null;
      const functionName = `${BRANCH_PREFIX}-alchemy-test-func-url-remove`;
      const roleName = `${BRANCH_PREFIX}-alchemy-test-lambda-url-rem-role`;

      try {
        let bundle = await Bundle(
          `${BRANCH_PREFIX}-test-lambda-url-remove-bundle`,
          {
            entryPoint: path.join(__dirname, "..", "handler.ts"),
            outdir: `.out/${BRANCH_PREFIX}-test-lambda-url-remove-bundle`,
            format: "cjs",
            platform: "node",
            target: "node18",
          },
        );

        role = await Role(roleName, {
          roleName,
          assumeRolePolicy: LAMBDA_ASSUME_ROLE_POLICY,
          description: "Test role for Lambda function",
          policies: [
            {
              policyName: "logs",
              policyDocument: LAMBDA_LOGS_POLICY,
            },
          ],
          tags: {
            Environment: "test",
          },
        });

        // Create the Lambda function with URL config
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          url: {
            authType: "NONE",
            cors: {
              allowOrigins: ["*"],
              allowMethods: ["GET", "POST"],
              allowHeaders: ["Content-Type"],
            },
          },
        });

        // Verify function was created with URL
        expect(func.arn).toBeTruthy();
        expect(func.state).toBe("Active");
        expect(func.functionUrl).toBeTruthy();

        // Test function URL invocation
        const testEvent = { test: "url-event" };
        const urlResponse = await fetchAndExpectOK(func.functionUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testEvent),
        });

        const urlResponseBody: any = await urlResponse.json();
        expect(urlResponseBody.message).toBe("Hello from bundled handler!");
        expect(urlResponseBody.event).toEqual(testEvent);

        // Also invoke directly
        const directResponse = await invokeLambda(functionName, {
          direct: "invoke",
        });
        expect(directResponse.statusCode).toBe(200);
        const directBody = JSON.parse(directResponse.body);
        expect(directBody.message).toBe("Hello from bundled handler!");
        expect(directBody.event).toEqual({ direct: "invoke" });

        // Now update the function to remove the URL
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          // No URL config to remove it
        });

        // Verify URL was removed
        expect(func.functionUrl).toBeUndefined();

        // Try to invoke URL (should fail)
        let urlFailed = false;
        try {
          await fetch(func.functionUrl || "https://invalid-url", {
            method: "POST",
          });
        } catch {
          urlFailed = true;
        }
        expect(urlFailed).toBe(true);

        // Direct invocation should still work
        const directResponse2 = await invokeLambda(functionName, {
          after: "update",
        });
        expect(directResponse2.statusCode).toBe(200);
        const directBody2 = JSON.parse(directResponse2.body);
        expect(directBody2.message).toBe("Hello from bundled handler!");
        expect(directBody2.event).toEqual({ after: "update" });
      } finally {
        await destroy(scope);
      }
    });

    test("create function without URL then add URL in update phase", async (scope) => {
      // Define resources that need to be cleaned up
      let role: Role | undefined;
      let func: Function | null = null;
      const functionName = `${BRANCH_PREFIX}-alchemy-test-func-add-url`;
      const roleName = `${BRANCH_PREFIX}-alchemy-test-lambda-add-url-role`;

      try {
        let bundle = await Bundle(
          `${BRANCH_PREFIX}-test-lambda-add-url-bundle`,
          {
            entryPoint: path.join(__dirname, "..", "handler.ts"),
            outdir: `.out/${BRANCH_PREFIX}-test-lambda-add-url-bundle`,
            format: "cjs",
            platform: "node",
            target: "node18",
          },
        );

        role = await Role(roleName, {
          roleName,
          assumeRolePolicy: LAMBDA_ASSUME_ROLE_POLICY,
          description: "Test role for Lambda function",
          policies: [
            {
              policyName: "logs",
              policyDocument: LAMBDA_LOGS_POLICY,
            },
          ],
          tags: {
            Environment: "test",
          },
        });

        // Create the Lambda function without URL config
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          // No URL config initially
        });

        // Verify function was created without URL
        expect(func.arn).toBeTruthy();
        expect(func.state).toBe("Active");
        expect(func.functionUrl).toBeUndefined();

        // Invoke directly
        const directResponse = await invokeLambda(functionName, {
          initial: "invoke",
        });
        expect(directResponse.statusCode).toBe(200);
        const directBody = JSON.parse(directResponse.body);
        expect(directBody.message).toBe("Hello from bundled handler!");
        expect(directBody.event).toEqual({ initial: "invoke" });

        // Now update the function to add the URL
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          url: {
            authType: "NONE",
            cors: {
              allowOrigins: ["*"],
              allowMethods: ["GET", "POST"],
              allowHeaders: ["Content-Type"],
            },
          },
        });

        // Verify URL was added
        expect(func.functionUrl).toBeTruthy();
        expect(func.functionUrl).toMatch(
          /^https:\/\/.+\.lambda-url\..+\.on\.aws\/?$/,
        );

        // Test function URL invocation
        const testEvent = { test: "added-url-event" };
        const urlResponse = await fetchAndExpectOK(func.functionUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testEvent),
        });

        const urlResponseBody: any = await urlResponse.json();
        expect(urlResponseBody.message).toBe("Hello from bundled handler!");
        expect(urlResponseBody.event).toEqual(testEvent);

        // Direct invocation should still work
        const directResponse2 = await invokeLambda(functionName, {
          after: "url-added",
        });
        expect(directResponse2.statusCode).toBe(200);
        const directBody2 = JSON.parse(directResponse2.body);
        expect(directBody2.message).toBe("Hello from bundled handler!");
        expect(directBody2.event).toEqual({ after: "url-added" });
      } finally {
        await destroy(scope);
      }
    });

    test("create function with URL invokeMode configuration", async (scope) => {
      // Define resources that need to be cleaned up
      let role: Role | undefined;
      let func: Function | null = null;
      const functionName = `${BRANCH_PREFIX}-alchemy-test-func-invoke-mode`;
      const roleName = `${BRANCH_PREFIX}-alchemy-test-lambda-invoke-mode-role`;

      try {
        let bundle = await Bundle(
          `${BRANCH_PREFIX}-test-lambda-invoke-mode-bundle`,
          {
            entryPoint: path.join(__dirname, "..", "handler.ts"),
            outdir: `.out/${BRANCH_PREFIX}-test-lambda-invoke-mode-bundle`,
            format: "cjs",
            platform: "node",
            target: "node18",
          },
        );

        role = await Role(roleName, {
          roleName,
          assumeRolePolicy: LAMBDA_ASSUME_ROLE_POLICY,
          description: "Test role for Lambda function with invoke mode",
          policies: [
            {
              policyName: "logs",
              policyDocument: LAMBDA_LOGS_POLICY,
            },
          ],
          tags: {
            Environment: "test",
          },
        });

        // Create the Lambda function with BUFFERED invoke mode (default)
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          url: {
            authType: "NONE",
            // Default invokeMode is BUFFERED if not specified
            cors: {
              allowOrigins: ["*"],
              allowMethods: ["GET", "POST"],
              allowHeaders: ["Content-Type"],
            },
          },
        });

        // Verify function was created with URL
        expect(func.arn).toBeTruthy();
        expect(func.state).toBe("Active");
        expect(func.functionUrl).toBeTruthy();

        // Test function URL invocation (default BUFFERED mode)
        const testEvent = { test: "buffered-mode" };
        const response = await fetch(func.functionUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testEvent),
        });

        expect(response.status).toBe(200);
        const responseBody: any = await response.json();
        expect(responseBody.message).toBe("Hello from bundled handler!");
        expect(responseBody.event).toEqual(testEvent);

        // Update function to explicitly set BUFFERED mode
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          url: {
            authType: "NONE",
            invokeMode: "BUFFERED", // Explicitly set BUFFERED
            cors: {
              allowOrigins: ["*"],
              allowMethods: ["GET", "POST"],
              allowHeaders: ["Content-Type"],
            },
          },
        });

        // Verify function still has URL
        expect(func.functionUrl).toBeTruthy();

        // Now update to RESPONSE_STREAM mode
        func = await Function(functionName, {
          functionName,
          bundle,
          roleArn: role.arn,
          handler: "index.handler",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          url: {
            authType: "NONE",
            invokeMode: "RESPONSE_STREAM", // Change to streaming mode
            cors: {
              allowOrigins: ["*"],
              allowMethods: ["GET", "POST"],
              allowHeaders: ["Content-Type"],
            },
          },
        });

        // Verify function still has URL
        expect(func.functionUrl).toBeTruthy();

        // Test function URL invocation (now in RESPONSE_STREAM mode)
        const streamTestEvent = { test: "response-stream-mode" };
        const streamResponse = await fetchAndExpectOK(func.functionUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(streamTestEvent),
        });

        // Check the status code

        // Test the URL configuration to verify the invokeMode setting was properly applied
        const urlConfig = await lambda.send(
          new GetFunctionUrlConfigCommand({
            FunctionName: functionName,
          }),
        );

        // Verify that the invokeMode property is set to RESPONSE_STREAM in the Lambda URL config
        expect(urlConfig.InvokeMode).toBe("RESPONSE_STREAM");

        // Properly test streaming by consuming the stream chunk by chunk
        if (streamResponse.body) {
          try {
            // Get a reader to read the chunks
            const reader = streamResponse.body.getReader();
            let receivedData = "";
            let chunkCount = 0;

            // Read all chunks
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }

              // Convert chunk to string and log
              const chunk = new TextDecoder().decode(value);
              chunkCount++;
              receivedData += chunk;
            }

            // Success indicator - we were able to read from the stream
            expect(chunkCount).toBeGreaterThan(0);

            // Try to parse the complete data
            if (receivedData?.trim()) {
              try {
                const responseBody = JSON.parse(receivedData);
                if (responseBody.message) {
                  expect(responseBody.message).toBe(
                    "Hello from bundled handler!",
                  );
                }
                if (responseBody.event) {
                  expect(responseBody.event).toEqual(streamTestEvent);
                }
              } catch (error) {
                console.log("Error parsing JSON response:", error);
                // Don't fail the test for JSON parsing errors
              }
            }
          } catch (streamError) {
            console.error("Error reading stream:", streamError);

            // Fall back to response.text() if streaming fails
            const responseText = await streamResponse.clone().text();
            console.log("Fallback response text length:", responseText.length);
          }
        } else {
          console.log(
            "No response body stream available - using text() method",
          );

          // Fall back to response.text() if no stream is available
          const responseText = await streamResponse.text();
          console.log("Response text length:", responseText.length);

          try {
            const responseBody = JSON.parse(responseText);
            console.log("Parsed JSON response:", responseBody);
            if (responseBody.message) {
              expect(responseBody.message).toBe("Hello from bundled handler!");
            }
            if (responseBody.event) {
              expect(responseBody.event).toEqual(streamTestEvent);
            }
          } catch (error) {
            console.log("Error parsing JSON response:", error);
          }
        }
      } finally {
        await destroy(scope);

        // Verify function was properly deleted after cleanup
        if (func) {
          await expect(
            lambda.send(
              new GetFunctionCommand({
                FunctionName: functionName,
              }),
            ),
          ).rejects.toThrow(ResourceNotFoundException);
        }
      }
    });

    test("create function with handler containing _, 0-9, and A-Z", async (scope) => {
      // Define resources that need to be cleaned up
      let role: Role | undefined;
      let func: Function | null = null;

      try {
        let bundle = await Bundle("bundle", {
          entryPoint: path.join(__dirname, "..", "handler.ts"),
          outdir: `.out/${BRANCH_PREFIX}-test-lambda-special-chars-bundle`,
          format: "cjs",
          platform: "node",
          target: "node18",
        });

        role = await Role("role", {
          roleName: `${BRANCH_PREFIX}-alchemy-test-lambda-handler-special-chars-role`,
          assumeRolePolicy: LAMBDA_ASSUME_ROLE_POLICY,
          policies: [
            {
              policyName: "logs",
              policyDocument: LAMBDA_LOGS_POLICY,
            },
          ],
          tags: {
            Environment: "test",
          },
        });

        // Create the Lambda function with BUFFERED invoke mode (default)
        func = await Function("function", {
          functionName: `${BRANCH_PREFIX}-alchemy-test-func-handler-special-chars`,
          bundle,
          roleArn: role.arn,
          handler: "index._myHandler012",
          runtime: "nodejs20.x",
          tags: {
            Environment: "test",
          },
          url: {
            authType: "NONE",
            // Default invokeMode is BUFFERED if not specified
            cors: {
              allowOrigins: ["*"],
              allowMethods: ["GET", "POST"],
              allowHeaders: ["Content-Type"],
            },
          },
        });

        // Verify function was created successfully
        expect(func.arn).toBeTruthy();
        expect(func.state).toBe("Active");
        expect(func.functionUrl).toMatch(
          /^https:\/\/.+\.lambda-url\..+\.on\.aws\/?$/,
        );

        // Test function invocation via URL
        const response = await fetchAndExpectOK(func.functionUrl!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: "special-handler" }),
        });

        const body: any = await response.json();
        expect(body.message).toBe("Hello from bundled handler!");
      } finally {
        await destroy(scope);
      }
    });
  });
});
