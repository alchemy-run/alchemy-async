import jsonpatch from "fast-json-patch";
import type { Context } from "../../context.ts";
import {
  registerDynamicResource,
  Resource,
  type Provider,
} from "../../resource.ts";
import { logger } from "../../util/logger.ts";
import { createCloudControlClient, type ProgressEvent } from "./client.ts";
import {
  AlreadyExistsError,
  ConcurrentOperationError,
  NotFoundError,
  UpdateFailedError,
} from "./error.ts";
import readOnlyPropertiesMap from "./properties.ts";
import updateTypesMap from "./update-types.ts";
const compare = jsonpatch.compare;

/**
 * Properties for creating or updating a Cloud Control resource
 */
export interface CloudControlResourceProps {
  /**
   * The type name of the resource (e.g. AWS::S3::Bucket)
   */
  typeName: string;

  /**
   * The desired state of the resource
   */
  desiredState: Record<string, any>;

  /**
   * If true, adopt existing resource instead of failing when resource already exists
   */
  adopt?: boolean;

  /**
   * Optional AWS region
   * @default AWS_REGION environment variable
   */
  region?: string;

  /**
   * AWS access key ID (overrides environment variable)
   */
  accessKeyId?: string;

  /**
   * AWS secret access key (overrides environment variable)
   */
  secretAccessKey?: string;

  /**
   * AWS session token for temporary credentials
   */
  sessionToken?: string;
}

/**
 * Output returned after Cloud Control resource creation/update
 */
export interface CloudControlResource extends CloudControlResourceProps {
  /**
   * The identifier of the resource
   */
  id: string;

  /**
   * Time at which the resource was created
   */
  createdAt: number;
}

// Register wildcard deletion handler for AWS::* pattern
// registerDeletionHandler(
//   "AWS::*",
//   //
// );

// Cache for memoizing resource handlers
const resourceHandlers: Record<string, any> = {};

/**
 * Filters out read-only properties from a resource state
 * @param typeName AWS resource type name (e.g., "AWS::S3::Bucket")
 * @param state Resource state object
 * @returns Filtered state object without read-only properties
 */
function filterReadOnlyProperties(
  typeName: string,
  state: Record<string, any>,
): Record<string, any> {
  // Parse the type name to get service and resource
  const [service, resource] = typeName.replace("AWS::", "").split("::");
  const readOnlyProps =
    (readOnlyPropertiesMap as any)[service]?.[resource] || [];

  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(state)) {
    if (!readOnlyProps.includes(key)) {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Checks if any immutable properties have changed between current and desired state
 * @param typeName AWS resource type name (e.g., "AWS::S3::Bucket")
 * @param currentState Current resource state
 * @param desiredState Desired resource state
 * @returns true if any immutable properties have changed
 */
function hasImmutablePropertyChanges(
  typeName: string,
  currentState: Record<string, any>,
  desiredState: Record<string, any>,
): boolean {
  // Parse the type name to get service and resource
  const [service, resource] = typeName.replace("AWS::", "").split("::");
  const propertyUpdateTypes =
    (updateTypesMap as any)[service]?.[resource] || {};

  // Check if any immutable properties have changed
  for (const [propertyName, updateType] of Object.entries(
    propertyUpdateTypes,
  )) {
    if (updateType === "Immutable") {
      const currentValue = currentState[propertyName];
      const desiredValue = desiredState[propertyName];

      // Deep comparison of property values
      if (JSON.stringify(currentValue) !== JSON.stringify(desiredValue)) {
        logger.log(
          `Immutable property '${propertyName}' changed from ${JSON.stringify(currentValue)} to ${JSON.stringify(desiredValue)}`,
        );
        return true;
      }
    }
  }

  return false;
}

/**
 * Creates a memoized Resource handler for a CloudFormation resource type
 *
 * @param typeName CloudFormation resource type (e.g., "AWS::S3::Bucket")
 * @returns A memoized Resource handler for the specified type
 */
export function createResourceType(typeName: string) {
  return (resourceHandlers[typeName] ??= Resource(
    typeName,
    function (
      this: Context<CloudControlResource, CloudControlResourceProps>,
      id: string,
      props: Record<string, any> & {
        adopt?: boolean;
        region?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        sessionToken?: string;
      },
    ) {
      // Extract Alchemy-specific properties
      const {
        adopt,
        region,
        accessKeyId,
        secretAccessKey,
        sessionToken,
        ...desiredState
      } = props;

      return CloudControlLifecycle.bind(this)(id, {
        typeName,
        desiredState,
        adopt,
        region,
        accessKeyId,
        secretAccessKey,
        sessionToken,
      });
    },
  ));
}

/**
 * AWS Cloud Control Resource (Generic Handler)
 *
 * This exported resource provides a generic way to manage any AWS resource
 * supported by the Cloud Control API by explicitly passing the `typeName`.
 * It is intended for direct use when the specific resource type might not be
 * known at compile time or when not using the typed Proxy interface.
 *
 * For the strongly-typed Proxy interface (e.g., `AWS.S3.Bucket(...)`), Alchemy
 * uses internal handlers generated by the `createResourceType` factory function.
 *
 * Creates and manages AWS resources using the Cloud Control API.
 *
 * @example
 * // Create an S3 bucket
 * const bucket = await CloudControlResource("my-bucket", {
 *   typeName: "AWS::S3::Bucket",
 *   desiredState: {
 *     BucketName: "my-unique-bucket-name",
 *     VersioningConfiguration: {
 *       Status: "Enabled"
 *     }
 *   }
 * });
 *
 * @example
 * // Create a DynamoDB table
 * const table = await CloudControlResource("users-table", {
 *   typeName: "AWS::DynamoDB::Table",
 *   desiredState: {
 *     TableName: "users",
 *     AttributeDefinitions: [
 *       {
 *         AttributeName: "id",
 *         AttributeType: "S"
 *       }
 *     ],
 *     KeySchema: [
 *       {
 *         AttributeName: "id",
 *         KeyType: "HASH"
 *       }
 *     ],
 *     ProvisionedThroughput: {
 *       ReadCapacityUnits: 5,
 *       WriteCapacityUnits: 5
 *     }
 *   }
 * });
 */
export const CloudControlResource = Resource(
  "aws::CloudControlResource",
  CloudControlLifecycle,
);

// register a catch-all for AWS::* resources (Resources created with the Control API)
registerDynamicResource((typeName) => {
  if (typeName.startsWith("AWS::")) {
    return Resource(
      typeName,
      function (
        this: Context<CloudControlResource, CloudControlResourceProps>,
        id: string,
        props: Omit<CloudControlResourceProps, "typeName">,
      ) {
        return CloudControlLifecycle.bind(this)(id, {
          typeName,
          ...props,
        });
      },
    ) as unknown as Provider;
  }
  return undefined;
});

async function CloudControlLifecycle(
  this: Context<CloudControlResource, CloudControlResourceProps>,
  id: string,
  props: CloudControlResourceProps,
) {
  const client = await createCloudControlClient({
    region: props.region,
    accessKeyId: props.accessKeyId,
    secretAccessKey: props.secretAccessKey,
    sessionToken: props.sessionToken,
  });

  if (this.phase === "delete") {
    if (this.output?.id) {
      try {
        await client.deleteResource(props.typeName, this.output.id);
      } catch (error) {
        if (error instanceof NotFoundError) {
          // great, this is the desired outcome
        } else {
          throw error;
        }
      }
    }
    return this.destroy();
  }

  let response: ProgressEvent | undefined;
  if (this.phase === "update" && this.output?.id) {
    // Check if any immutable properties have changed
    const currentResource = await client.getResource(
      props.typeName,
      this.output.id,
    );
    if (!currentResource) {
      // The physical resource no longer exists (deleted or detached out-of-band),
      // so there is nothing to patch. Falling through to UpdateResource would fail
      // on types with no update support (e.g. AWS::EC2::VolumeAttachment, whose
      // properties are all Immutable). Recreate via replacement instead. Force the
      // replacement (delete-before-create) because the old resource is already gone
      // (delete tolerates NotFoundError) and a deferred delete would destroy the
      // new resource if it reuses the same identifier (e.g. an unchanged BucketName).
      logger.log(
        `Resource ${id} no longer exists (empty read-back on update), requiring replacement`,
      );
      return this.replace(true);
    }
    if (
      hasImmutablePropertyChanges(
        props.typeName,
        currentResource,
        props.desiredState,
      )
    ) {
      logger.log(
        `Resource ${id} has immutable property changes, requiring replacement`,
      );
      return this.replace();
    }

    // Update existing resource
    response = await updateResourceWithPatch(
      client,
      props.typeName,
      this.output.id,
      this.output.desiredState,
      props.desiredState,
    );
  } else {
    // Create new resource
    try {
      response = await client.createResource(
        props.typeName,
        props.desiredState,
      );
    } catch (error) {
      if (error instanceof AlreadyExistsError && props.adopt) {
        const resource = (await client.getResource(
          props.typeName,
          error.progressEvent.Identifier!,
        ))!;

        response = await updateResourceWithPatch(
          client,
          props.typeName,
          error.progressEvent.Identifier!,
          resource,
          props.desiredState,
        );
      } else if (error instanceof ConcurrentOperationError) {
        // Handle concurrent operation exception
        logger.log(error.message);
        if (!props.adopt) {
          // If adopt is not true, concurrent operations are an error
          throw error;
        }
        logger.log(
          `Waiting for concurrent operation with request token '${error.requestToken}' to complete`,
        );

        // Wait for the concurrent operation to complete by polling it
        try {
          // Poll the concurrent operation until it completes
          const concurrentResult = await client.poll(error.requestToken);

          // The concurrent operation succeeded, now adopt the resource
          const resource = (await client.getResource(
            props.typeName,
            concurrentResult.Identifier!,
          ))!;

          // Apply our desired state as a patch to the existing resource
          response = await updateResourceWithPatch(
            client,
            props.typeName,
            concurrentResult.Identifier!,
            resource,
            props.desiredState,
          );
        } catch (pollError) {
          // If the concurrent operation failed, we can try to create the resource ourselves
          if (pollError instanceof UpdateFailedError) {
            response = await client.createResource(
              props.typeName,
              props.desiredState,
            );
          } else {
            throw pollError;
          }
        }
      } else {
        throw error;
      }
    }
  }

  if (response.OperationStatus === "FAILED") {
    throw new Error(
      `Failed to ${this.phase} resource ${id}: ${response.ErrorCode}`,
    );
  }

  return {
    ...props,
    id: response.Identifier!,
    createdAt: Date.now(),
    ...(await client.getResource(props.typeName, response.Identifier!)),
  };
}

async function updateResourceWithPatch(
  client: any,
  typeName: string,
  resourceId: string,
  currentState: Record<string, any>,
  desiredState: Record<string, any>,
): Promise<ProgressEvent> {
  // Filter out read-only properties to avoid patch conflicts
  const filteredCurrentState = filterReadOnlyProperties(typeName, currentState);

  // Create and apply patch
  return await client.updateResource(
    typeName,
    resourceId,
    compare(filteredCurrentState, desiredState),
  );
}
