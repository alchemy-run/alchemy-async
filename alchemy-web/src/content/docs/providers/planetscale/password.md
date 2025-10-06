---
title: PlanetScale Password
description: Learn how to create and manage database passwords for PlanetScale branches using Alchemy.
---

# Password

The Password resource lets you create and manage [PlanetScale database passwords](https://planetscale.com/docs/concepts/password) for secure database access with specific roles and permissions.

:::note
Passwords are only available for MySQL databases. For PostgreSQL databases, use the [Role](/providers/planetscale/role) resource instead.
:::

## Minimal Example

Create a basic reader password for a database branch:

```ts
import { Password } from "alchemy/planetscale";

const readerPassword = await Password("app-reader", {
  name: "app-reader",
  organization: "my-org",
  database: "my-app-db",
  branch: "main",
  role: "reader"
});

// Access connection details
console.log(`Host: ${readerPassword.host}`);
console.log(`Username: ${readerPassword.username}`);
console.log(`Password: ${readerPassword.password.unencrypted}`);
```

## Writer Password with TTL

Create a writer password that expires after 24 hours:

```ts
import { Password } from "alchemy/planetscale";

const writerPassword = await Password("app-writer", {
  name: "app-writer",
  organization: "my-org",
  database: "my-app-db",
  branch: "development",
  role: "writer",
  ttl: 86400 // 24 hours in seconds
});

// Password will expire at the specified time
console.log(`Expires at: ${writerPassword.expiresAt}`);
```

## Admin Password with IP Restrictions

Create an admin password that only allows connections from specific IP addresses:

```ts
import { Password } from "alchemy/planetscale";

const adminPassword = await Password("admin-access", {
  name: "admin-access",
  organization: "my-org",
  database: "my-app-db",
  branch: "main",
  role: "admin",
  cidrs: ["203.0.113.0/24", "198.51.100.0/24"],
  ttl: 3600 // 1 hour
});
```

## Password with Custom API Key

Create a password using a specific API key instead of the default environment variable:

```ts
import { Password } from "alchemy/planetscale";

const password = await Password("custom-auth", {
  name: "custom-auth",
  organization: "my-org",
  database: "my-app-db",
  branch: "main",
  role: "readwriter",
  apiKey: alchemy.secret(process.env.CUSTOM_PLANETSCALE_TOKEN)
});
```

## Read Replica Password

Create a password for accessing a read replica:

```ts
import { Password } from "alchemy/planetscale";

const replicaPassword = await Password("replica-reader", {
  name: "replica-reader",
  organization: "my-org",
  database: "my-app-db",
  branch: "main",
  role: "reader",
  replica: true
});
```

## Using with Database and Branch Resources

Combine Password with Database and Branch resources for a complete setup:

```ts
import { Database, Branch, Password } from "alchemy/planetscale";

// Create a database
const database = await Database("my-app-db", {
  name: "my-app-db",
  organization: "my-org",
  clusterSize: "PS_10"
});

// Create a development branch
const devBranch = await Branch("feature-123", {
  name: "feature-123",
  organization: "my-org",
  databaseName: database.name,
  parentBranch: "main",
  isProduction: false
});

// Create passwords using resource instances
const readerPassword = await Password("dev-reader", {
  name: "dev-reader",
  database: database, // Using Database resource
  branch: devBranch, // Using Branch resource
  role: "reader"
});

const writerPassword = await Password("dev-writer", {
  name: "dev-writer",
  database: database, // Using Database resource
  branch: devBranch, // Using Branch resource
  role: "writer",
  ttl: 86400 // 24 hours
});
```

## Mixed Resource Usage

You can also mix string identifiers with resource instances:

```ts
import { Database, Password } from "alchemy/planetscale";

// Create a database resource
const database = await Database("my-app-db", {
  name: "my-app-db",
  organization: "my-org",
  clusterSize: "PS_10"
});

// Use Database resource with string branch name
const password = await Password("mixed-example", {
  name: "mixed-example",
  database: database, // Using Database resource
  branch: "main", // Using string branch name
  role: "reader"
});
```

## Password Roles

PlanetScale supports different password roles:

- **`reader`**: Read-only access to the database
- **`writer`**: Write access to the database (includes read permissions)
- **`readwriter`**: Equivalent to writer role
- **`admin`**: Full administrative access including DDL operations

## Security Best Practices

When working with database passwords, follow these security best practices:

1. **Use appropriate roles**: Grant the minimum necessary permissions
2. **Set TTL values**: Use time-limited passwords for temporary access
3. **Restrict IP access**: Use CIDR blocks to limit access to specific networks
4. **Rotate passwords regularly**: Create new passwords and delete old ones periodically
5. **Use environment variables**: Store API keys and connection strings securely

## Connection String Usage

The password resource provides connection details that can be used with MySQL clients:

```ts
import { Password } from "alchemy/planetscale";
import mysql from "mysql2/promise";

const password = await Password("app-db-access", {
  name: "app-db-access",
  organization: "my-org",
  database: "my-app-db",
  branch: "main",
  role: "readwriter"
});

// Create MySQL connection
const connection = await mysql.createConnection({
  host: password.host,
  user: password.username,
  password: password.password.unencrypted,
  database: "my-app-db",
  ssl: { rejectUnauthorized: true }
});

// Use the connection
const [rows] = await connection.execute('SELECT * FROM users LIMIT 10');
console.log(rows);
```