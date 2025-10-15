---
title: Docker Provider
description: Deploy and manage Docker resources using Alchemy
---

The Docker provider allows you to create, manage, and orchestrate Docker resources directly from your Alchemy applications. With this provider, you can pull images, run containers, create networks, and more, all using the familiar Alchemy Resource syntax.

## Resources

The Docker provider includes the following resources:

- [RemoteImage](/providers/docker/remote-image/) - Pull and manage Docker images
- [Image](/providers/docker/image/) - Build Docker images from local Dockerfiles
- [Container](/providers/docker/container/) - Run and manage Docker containers
- [Network](/providers/docker/network/) - Create and manage Docker networks
- [Volume](/providers/docker/volume/) - Create and manage persistent Docker volumes

## Example

Here's a complete example of using the Docker provider to create a web application with Redis, custom images, and persistent volumes:

```typescript
import * as docker from "alchemy/docker";

// Create a Docker network
const network = await docker.Network("app-network", {
  name: "my-application-network"
});

// Create a persistent volume for Redis data
const redisVolume = await docker.Volume("redis-data", {
  name: "redis-data",
  labels: [
    { name: "app", value: "my-application" },
    { name: "service", value: "redis" }
  ]
});

// Pull Redis image
const redisImage = await docker.RemoteImage("redis-image", {
  name: "redis",
  tag: "alpine"
});

// Run Redis container with persistent volume
const redis = await docker.Container("redis", {
  image: redisImage.imageRef,
  name: "redis",
  networks: [{ name: network.name }],
  volumes: [
    {
      hostPath: redisVolume.name,
      containerPath: "/data"
    }
  ],
  start: true
});

// Build a custom application image from local Dockerfile
const appImage = await docker.Image("app-image", {
  name: "my-web-app",
  tag: "latest",
  build: {
    context: "./app",
    buildArgs: {
      NODE_ENV: "production"
    }
  }
});

// Create a volume for application logs
const logsVolume = await docker.Volume("logs-volume", {
  name: "app-logs",
  labels: {
    "com.example.environment": "production",
    "com.example.backup": "daily"
  }
});

// Run the application container
const app = await docker.Container("app", {
  image: appImage,  // Using the custom built image
  name: "web-app",
  ports: [{ external: 3000, internal: 3000 }],
  networks: [{ name: network.name }],
  volumes: [
    {
      hostPath: logsVolume.name,
      containerPath: "/app/logs"
    }
  ],
  environment: {
    REDIS_HOST: "redis",
    NODE_ENV: "production"
  },
  restart: "always",
  start: true
});

// Output the URL
export const url = `http://localhost:3000`;
```

## Additional Resources

For more complex examples, see the [Docker Example](https://github.com/alchemy-run/alchemy/tree/main/examples/docker) in the Alchemy repository.
