import { Container } from "@cloudflare/containers";

export class MyContainer extends Container {
  defaultPort = 8080; // The default port for the container to listen on
  sleepAfter =
    "3m"; // Sleep the container if no requests are made in this timeframe

  envVars = {
    MESSAGE: "I was passed in via the container class!",
  };

  override onStart() {
    console.log("Container successfully started");
  }

  override onStop() {
    console.log("Container successfully shut down");
  }

  override onError(error: unknown) {
    console.log("Container error:", error);
  }
}

export default {
  async fetch(
    request: Request,
    env: { MY_CONTAINER: DurableObjectNamespace<MyContainer> },
  ): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    // If you want to route requests to a specific container,
    // pass a unique container identifier to .get()

    if (pathname.startsWith("/container")) {
      const containerInstance = getContainer(env.MY_CONTAINER, pathname);
      return containerInstance.fetch(request);
    }

    if (pathname.startsWith("/error")) {
      const containerInstance = getContainer(env.MY_CONTAINER, "error-test");
      return containerInstance.fetch(request);
    }

    if (pathname.startsWith("/lb")) {
      const containerInstance = await getRandom(env.MY_CONTAINER, 3);
      return containerInstance.fetch(request);
    }

    if (pathname.startsWith("/singleton")) {
      // getContainer will return a specific instance if no second argument is provided
      return getContainer(env.MY_CONTAINER).fetch(request);
    }

    return new Response(
      "Call /container to start a container with a 10s timeout.\nCall /error to start a container that errors\nCall /lb to test load balancing",
    );
  },
};

/**
 * Get a random container instances across N instances
 * @param binding The Container's Durable Object binding
 * @param instances Number of instances to load balance across
 * @returns A promise resolving to a container stub ready to handle requests
 */
export async function getRandom<T extends Container>(
  binding: DurableObjectNamespace<T>,
  instances = 3,
): Promise<DurableObjectStub<T>> {
  // Generate a random ID within the range of instances
  const id = Math.floor(Math.random() * instances).toString();

  // Always use idFromName for consistent behavior
  // idFromString requires a 64-hex digit string which is hard to generate
  const objectId = binding.idFromName(`instance-${id}`);

  // Return the stub for the selected instance
  return binding.get(objectId);
}

/**
 * Deprecated funtion to get random container instances. Renamed to getRandom
 * @param binding The Container's Durable Object binding
 * @param instances Number of instances to load balance across
 * @returns A promise resolving to a container stub ready to handle requests
 */
export async function loadBalance<T extends Container>(
  binding: DurableObjectNamespace<T>,
  instances = 3,
): Promise<DurableObjectStub<T>> {
  console.warn(
    "loadBalance is deprecated, please use getRandom instead. This will be removed in a future version.",
  );
  return getRandom(binding, instances);
}

/**
 * Get a container stub
 * @param binding The Container's Durable Object binding
 * @param name The name of the instance to get, uses 'cf-singleton-container' by default
 * @returns A container stub ready to handle requests
 */
export const singletonContainerId = "cf-singleton-container";
export function getContainer<T extends Container>(
  binding: DurableObjectNamespace<T>,
  name?: string,
): DurableObjectStub<T> {
  const objectId = binding.idFromName(name ?? singletonContainerId);
  return binding.get(objectId);
}
