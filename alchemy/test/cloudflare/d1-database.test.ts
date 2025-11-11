import * as fs from "node:fs/promises";
import * as os from "node:os";
import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  type CloudflareApi,
  createCloudflareApi,
} from "../../src/cloudflare/api.ts";
import {
  createDatabase,
  D1Database,
  deleteDatabase,
  listDatabases,
} from "../../src/cloudflare/d1-database.ts";
import {
  executeD1SQL,
  getAppliedMigrations,
} from "../../src/cloudflare/d1-migrations.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { BRANCH_PREFIX } from "../util.ts";

import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("D1 Database Resource", async () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-db`;

  // Create Cloudflare API client for direct verification
  const api = await createCloudflareApi();

  test("create and delete database", async (scope) => {
    // Create a test database
    let database: D1Database | undefined;

    try {
      database = await D1Database(testId, {
        name: testId,
        primaryLocationHint: "wnam", // West North America
        adopt: true,
      });

      expect(database.name).toEqual(testId);
      expect(database.id).toBeTruthy();

      // Check if database exists by listing databases
      const databases = await listDatabases(api);
      const foundDatabase = databases.find((db) => db.name === testId);
      expect(foundDatabase).toBeTruthy();
      expect(foundDatabase?.id).toEqual(database.id);
    } finally {
      await alchemy.destroy(scope);

      // Verify database was deleted
      if (database) {
        await assertDatabaseDeleted(database);
      }
    }
  });

  test("primary location hint", async (scope) => {
    const locationDb = `${testId}-location`;

    try {
      // Create a database with West North America location hint
      const database = await D1Database(locationDb, {
        name: locationDb,
        primaryLocationHint: "wnam", // West North America
        adopt: true,
      });

      expect(database.name).toEqual(locationDb);
      expect(database.id).toBeTruthy();
      expect(database.primaryLocationHint).toEqual("wnam");

      // Check if database exists
      const databases = await listDatabases(api);
      const foundDatabase = databases.find((db) => db.name === locationDb);
      expect(foundDatabase).toBeTruthy();
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("create database with read replication", async (scope) => {
    const replicationCreateDb = `${testId}-replication-create`;

    try {
      // Create a database with read replication enabled from the start
      const database = await D1Database(replicationCreateDb, {
        name: replicationCreateDb,
        readReplication: {
          mode: "auto",
        },
        adopt: true,
      });

      expect(database.name).toEqual(replicationCreateDb);
      expect(database.id).toBeTruthy();
      expect(database.readReplication?.mode).toEqual("auto");

      // Verify the read replication setting by fetchAndExpectOKing the database directly from API
      const getResponse = await api.get(
        `/accounts/${api.accountId}/d1/database/${database.id}`,
      );
      expect(getResponse.ok).toBe(true);

      const dbData: any = await getResponse.json();
      expect(dbData.result.read_replication?.mode).toEqual("auto");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("update read replication mode", async (scope) => {
    const replicationDb = `${testId}-replication`;

    try {
      // Create a database with default settings
      let database = await D1Database(replicationDb, {
        name: replicationDb,
        adopt: true,
        primaryLocationHint: "wnam",
      });

      expect(database.name).toEqual(replicationDb);
      expect(database.id).toBeTruthy();

      // Update the database with disabled read replication
      database = await D1Database(replicationDb, {
        name: replicationDb,
        readReplication: {
          mode: "disabled",
        },
        adopt: true,
        primaryLocationHint: "wnam",
      });

      // Verify the update
      expect(database.readReplication?.mode).toEqual("disabled");

      // Update the database with disabled read replication
      database = await D1Database(replicationDb, {
        name: replicationDb,
        readReplication: {
          mode: "auto",
        },
        adopt: true,
        primaryLocationHint: "wnam",
      });

      expect(database.readReplication?.mode).toEqual("auto");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("throws error on invalid update", async (scope) => {
    const invalidUpdateDb = `${testId}-invalid-update`;

    try {
      // Create a database with West North America location hint
      const database = await D1Database(invalidUpdateDb, {
        name: invalidUpdateDb,
        primaryLocationHint: "wnam", // West North America
        adopt: true,
      });

      expect(database.name).toEqual(invalidUpdateDb);
      expect(database.id).toBeTruthy();
      expect(database.primaryLocationHint).toEqual("wnam");

      // Attempt to update with a different location hint, which should throw an error
      await expect(
        D1Database(invalidUpdateDb, {
          name: invalidUpdateDb,
          primaryLocationHint: "eeur", // East Europe - different from original
          adopt: true,
        }),
      ).rejects.toThrow("Cannot update primaryLocationHint");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("create database with migrationsDir applies migrations", async (scope) => {
    const migrationsDb = `${testId}-with-migrations`;
    let database: D1Database | undefined;

    try {
      database = await D1Database(migrationsDb, {
        name: migrationsDb,
        migrationsDir: `${__dirname}/migrations`,
        adopt: true,
      });

      expect(database.name).toEqual(migrationsDb);
      expect(database.id).toBeTruthy();

      // Verify the migration table structure by querying migration records
      const migrationRecords = await executeD1SQL(
        {
          accountId: api.accountId,
          databaseId: database.id,
          api: api,
          migrationsFiles: [],
          migrationsTable: "d1_migrations",
        },
        "SELECT id, name FROM d1_migrations ORDER BY id;",
      );

      const records = migrationRecords.result[0].results;
      expect(records).toEqual([{ id: "00001", name: "001_create_table.sql" }]);

      // Now check if the test_migrations_table exists by querying the schema
      const tables = await getResults(
        api,
        database,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='test_migrations_table';",
      );

      expect(tables.length).toBeGreaterThan(0);
      expect(tables[0]?.name).toEqual("test_migrations_table");
    } finally {
      await alchemy.destroy(scope);
      if (database) {
        await assertDatabaseDeleted(database);
      }
    }
  });

  test("create database with custom migrationsTable", async (scope) => {
    const customMigrationsDb = `${testId}-custom-migrations-table`;
    let database: D1Database | undefined;

    try {
      database = await D1Database(customMigrationsDb, {
        name: customMigrationsDb,
        migrationsDir: `${__dirname}/migrations`,
        migrationsTable: "custom_migration_tracking",
        adopt: true,
      });

      expect(database.name).toEqual(customMigrationsDb);
      expect(database.id).toBeTruthy();

      // Verify the actual migration content was applied (same as the existing test)
      const tables = await getResults(
        api,
        database,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='test_migrations_table';",
      );

      expect(tables.length).toBeGreaterThan(0);
      expect(tables[0]?.name).toEqual("test_migrations_table");

      // Verify the custom migration table was created instead of the default
      const allTables = await getResults(
        api,
        database,
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('custom_migration_tracking', 'd1_migrations') ORDER BY name;",
      );

      // Should have the custom table but not the default one
      expect(allTables.length).toBeGreaterThan(0);
      expect(
        allTables.some((t) => t.name === "custom_migration_tracking"),
      ).toBe(true);
      expect(allTables.some((t) => t.name === "d1_migrations")).toBe(false);
    } finally {
      await alchemy.destroy(scope);
      if (database) {
        await assertDatabaseDeleted(database);
      }
    }
  });

  test("clone from existing database by ID", async (scope) => {
    const sourceDb = `${testId}-source-for-clone`;
    const targetDb = `${testId}-cloned-from-id`;

    try {
      // Create a source database with test data
      const source = await D1Database(sourceDb, {
        name: sourceDb,
        adopt: true,
      });

      // Add test data to the source database
      await api.post(
        `/accounts/${api.accountId}/d1/database/${source.id}/query`,
        {
          sql: `
            CREATE TABLE test_clone (id INTEGER PRIMARY KEY, name TEXT);
            INSERT INTO test_clone (id, name) VALUES (1, 'test-data');
          `,
        },
      );

      // Create a target database as a clone of the source by ID
      const cloned = await D1Database(targetDb, {
        name: targetDb,
        clone: { id: source.id },
        adopt: true,
      });

      expect(cloned.name).toEqual(targetDb);
      expect(cloned.id).toBeTruthy();

      // Verify the cloned data exists in the target database
      const results = await getResults(
        api,
        cloned,
        "SELECT * FROM test_clone WHERE id = 1;",
      );

      expect(results.length).toEqual(1);
      expect(results[0].name).toEqual("test-data");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("clone from existing database by name", async (scope) => {
    const sourceDb = `${testId}-source-by-name`;
    const targetDb = `${testId}-cloned-from-name`;

    try {
      // Create a source database with test data
      const source = await D1Database(sourceDb, {
        name: sourceDb,
        adopt: true,
      });

      // Add test data to the source database
      await api.post(
        `/accounts/${api.accountId}/d1/database/${source.id}/query`,
        {
          sql: `
            CREATE TABLE test_clone_by_name (id INTEGER PRIMARY KEY, value TEXT);
            INSERT INTO test_clone_by_name (id, value) VALUES (1, 'name-lookup-test');
          `,
        },
      );

      // Create a target database as a clone of the source by name
      const cloned = await D1Database(targetDb, {
        name: targetDb,
        clone: { name: sourceDb },
        adopt: true,
      });

      expect(cloned.name).toEqual(targetDb);
      expect(cloned.id).toBeTruthy();

      const results = await getResults(
        api,
        cloned,
        "SELECT * FROM test_clone_by_name WHERE id = 1;",
      );

      expect(results.length).toEqual(1);
      expect(results[0].value).toEqual("name-lookup-test");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("clone by passing the source database object directly", async (scope) => {
    const sourceDbId = `${testId}-source-direct`;
    const targetDbId = `${testId}-cloned-direct`;

    try {
      // Create a source database with test data
      const sourceDb = await D1Database(sourceDbId, {
        name: sourceDbId,
        adopt: true,
      });

      // Add test data to the source database
      await api.post(
        `/accounts/${api.accountId}/d1/database/${sourceDb.id}/query`,
        {
          sql: `
            CREATE TABLE direct_clone_test (id INTEGER PRIMARY KEY, data TEXT);
            INSERT INTO direct_clone_test (id, data) VALUES (1, 'direct-clone-data');
          `,
        },
      );

      // Create a target database as a clone by passing the source database object directly
      const clonedDb = await D1Database(targetDbId, {
        name: targetDbId,
        clone: sourceDb, // Pass the D1Database object directly
        adopt: true,
      });

      expect(clonedDb.name).toEqual(targetDbId);
      expect(clonedDb.id).toBeTruthy();

      // Verify the cloned data exists in the target database
      const results = await getResults(
        api,
        clonedDb,
        "SELECT * FROM direct_clone_test WHERE id = 1;",
      );

      expect(results.length).toEqual(1);
      expect(results[0].data).toEqual("direct-clone-data");
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("create and test worker with D1 database binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-d1`;

    let worker: Worker<{ DATABASE: D1Database }> | undefined;
    let db: D1Database | undefined;

    try {
      // Create a D1 database
      db = await D1Database(`${BRANCH_PREFIX}-test-db`, {
        name: `${BRANCH_PREFIX}-test-db`,
        primaryLocationHint: "wnam", // West North America
      });

      expect(db.id).toBeTruthy();
      expect(db.name).toEqual(`${BRANCH_PREFIX}-test-db`);

      // Create a worker with the D1 database binding
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              const url = new URL(request.url);

              // Initialize the database with a table and data
              if (url.pathname === '/init-db') {
                try {
                  const db = env.DATABASE;

                  // Create a test table
                  await db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)");

                  // Insert some test data
                  await db.exec("INSERT INTO users (name, email) VALUES ('Test User', 'test@example.com')");

                  return new Response('Database initialized successfully!', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                  });
                } catch (error) {
                  return new Response('Error initializing database: ' + error.message, {
                    status: 500,
                    headers: { 'Content-Type': 'text/plain' }
                  });
                }
              }

              // Query data from the database
              if (url.pathname === '/query-db') {
                try {
                  const db = env.DATABASE;

                  // Query the database
                  const { results } = await db.prepare("SELECT * FROM users").all();

                  return new Response(JSON.stringify({ success: true, data: results }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  });
                } catch (error) {
                  return new Response(JSON.stringify({
                    success: false,
                    error: error.message
                  }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                  });
                }
              }

              return new Response('D1 Database Worker is running!', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        url: true, // Enable workers.dev URL to test the worker
        bindings: {
          DATABASE: db,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toBeDefined();
      expect(worker.bindings!.DATABASE).toBeDefined();
      expect(worker.bindings!.DATABASE.id).toEqual(db.id);
      expect(worker.url).toBeTruthy();

      // Initialize the database with a table and data
      const initResponse = await fetchAndExpectOK(`${worker.url}/init-db`);
      expect(initResponse.status).toEqual(200);
      const initText = await initResponse.text();
      expect(initText).toEqual("Database initialized successfully!");

      // Query data from the database
      const queryResponse = await fetchAndExpectOK(`${worker.url}/query-db`);
      expect(queryResponse.status).toEqual(200);
      const queryData: any = await queryResponse.json();
      expect(queryData.success).toEqual(true);
      expect(queryData.data.length).toBeGreaterThan(0);
      expect(queryData.data[0].name).toEqual("Test User");
      expect(queryData.data[0].email).toEqual("test@example.com");
    } finally {
      await destroy(scope);
    }
  }, 120000); // Increased timeout for D1 database operations

  test("migrates legacy migration schema and applies new migrations", async (scope) => {
    const legacyMigrationDb = `${testId}-legacy-migration`;
    let tempDir: string | undefined;
    let databaseId: string | undefined;

    try {
      // Step 0: Clean up any existing database with the same name
      try {
        const existingDatabases = await listDatabases(api);
        const existingDb = existingDatabases.find(
          (db) => db.name === legacyMigrationDb,
        );
        if (existingDb) {
          await deleteDatabase(api, existingDb.id);
        }
      } catch {}

      // Create a temporary directory for migration files
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "d1-test-migrations-"));

      // Create test migration files
      await fs.writeFile(
        path.join(tempDir, "0002_create_users.sql"),
        `CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`,
      );

      await fs.writeFile(
        path.join(tempDir, "0003_create_posts.sql"),
        `CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          title TEXT NOT NULL,
          content TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`,
      );

      await fs.writeFile(
        path.join(tempDir, "0004_add_users_data.sql"),
        `INSERT INTO users (name, email) VALUES 
          ('Alice', 'alice@example.com'),
          ('Bob', 'bob@example.com');`,
      );

      // Step 1: Create a D1 database manually using the createDatabase function
      const dbResponse = await createDatabase(api, legacyMigrationDb, {
        primaryLocationHint: "wnam",
      });

      databaseId = dbResponse.result.uuid;
      expect(databaseId).toBeTruthy();

      if (!databaseId) {
        throw new Error("Database creation failed - no ID returned");
      }

      // Step 2: Create a legacy migration table manually (2-column schema)
      const legacyMigrationsTable = "d1_migrations";
      const createLegacyTableSQL = `CREATE TABLE ${legacyMigrationsTable} (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );`;

      await executeD1SQL(
        {
          accountId: api.accountId,
          databaseId: databaseId,
          api: api,
          migrationsFiles: [],
          migrationsTable: legacyMigrationsTable,
        },
        createLegacyTableSQL,
      );

      // Step 3: Insert some fake migration records into the legacy table (simulating old migrations)
      const insertLegacySQL = `INSERT INTO ${legacyMigrationsTable} (id, applied_at) VALUES 
        ('0000_initial_setup.sql', datetime('now', '-1 day')),
        ('0001_add_indexes.sql', datetime('now', '-1 hour'));`;

      await executeD1SQL(
        {
          accountId: api.accountId,
          databaseId: databaseId,
          api: api,
          migrationsFiles: [],
          migrationsTable: legacyMigrationsTable,
        },
        insertLegacySQL,
      );

      // Step 4: Use D1Database resource with adopt: true and migrations
      // This should trigger the migration of the legacy schema and apply new migrations
      const database = await D1Database(legacyMigrationDb, {
        name: legacyMigrationDb,
        migrationsDir: tempDir,
        migrationsTable: legacyMigrationsTable,
        adopt: true,
      });

      expect(database.name).toEqual(legacyMigrationDb);
      expect(database.id).toBeTruthy();

      // Step 5: Verify the migration table structure was upgraded by checking for 'name' column
      const tableInfo = await executeD1SQL(
        {
          accountId: api.accountId,
          databaseId: database.id,
          api: api,
          migrationsFiles: [],
          migrationsTable: legacyMigrationsTable,
        },
        `PRAGMA table_info(${legacyMigrationsTable});`,
      );

      const columns = tableInfo.result[0].results;
      const hasNameColumn = columns.some((col: any) => col.name === "name");
      const hasIdColumn = columns.some((col: any) => col.name === "id");

      expect(hasIdColumn).toBe(true);
      expect(hasNameColumn).toBe(true);
      expect(columns.length).toBe(3); // id, name, applied_at

      // Step 6: Verify old migration records were preserved and new migrations were applied
      const finalApplied = await getAppliedMigrations({
        accountId: api.accountId,
        databaseId: database.id,
        api: api,
        migrationsFiles: [],
        migrationsTable: legacyMigrationsTable,
      });

      // Should have the migrated legacy records plus new migrations
      expect(finalApplied.size).toBeGreaterThanOrEqual(5); // 2 legacy + 3 new
      expect(finalApplied.has("0000_initial_setup.sql")).toBe(true);
      expect(finalApplied.has("0001_add_indexes.sql")).toBe(true);
      expect(finalApplied.has("0002_create_users.sql")).toBe(true);
      expect(finalApplied.has("0003_create_posts.sql")).toBe(true);
      expect(finalApplied.has("0004_add_users_data.sql")).toBe(true);

      // Step 7: Verify the actual table structure was created by the migrations
      const tables = await getResults(
        api,
        database,
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'posts') ORDER BY name;",
      );

      expect(tables.length).toBe(2);
      expect(tables[0].name).toBe("posts");
      expect(tables[1].name).toBe("users");

      // Step 8: Verify the data was inserted
      const users = await getResults(
        api,
        database,
        "SELECT name, email FROM users ORDER BY name;",
      );

      expect(users.length).toBe(2);
      expect(users[0].name).toBe("Alice");
      expect(users[0].email).toBe("alice@example.com");
      expect(users[1].name).toBe("Bob");
      expect(users[1].email).toBe("bob@example.com");

      // Step 9: Add a new migration file after initial adoption to test subsequent updates
      await fs.writeFile(
        path.join(tempDir, "0005_add_posts_data.sql"),
        `INSERT INTO posts (user_id, title, content) VALUES 
          (1, 'First Post', 'This is Alice first post'),
          (2, 'Welcome Post', 'Bob welcomes everyone');`,
      );

      // Step 10: Run migrations again with the new migration file
      const updatedDatabase = await D1Database(legacyMigrationDb, {
        name: legacyMigrationDb,
        migrationsDir: tempDir,
        migrationsTable: legacyMigrationsTable,
        adopt: true,
      });

      expect(updatedDatabase.id).toEqual(database.id); // Should be the same database

      // Step 11: Verify the new migration was applied
      const finalAppliedAfterUpdate = await getAppliedMigrations({
        accountId: api.accountId,
        databaseId: updatedDatabase.id,
        api: api,
        migrationsFiles: [],
        migrationsTable: legacyMigrationsTable,
      });

      // Should now have all 6 migrations (2 legacy + 3 initial + 1 new)
      expect(finalAppliedAfterUpdate.size).toBeGreaterThanOrEqual(6);
      expect(finalAppliedAfterUpdate.has("0000_initial_setup.sql")).toBe(true);
      expect(finalAppliedAfterUpdate.has("0001_add_indexes.sql")).toBe(true);
      expect(finalAppliedAfterUpdate.has("0002_create_users.sql")).toBe(true);
      expect(finalAppliedAfterUpdate.has("0003_create_posts.sql")).toBe(true);
      expect(finalAppliedAfterUpdate.has("0004_add_users_data.sql")).toBe(true);
      expect(finalAppliedAfterUpdate.has("0005_add_posts_data.sql")).toBe(true);

      // Step 12: Verify the new posts data was inserted
      const posts = await getResults(
        api,
        updatedDatabase,
        "SELECT user_id, title, content FROM posts ORDER BY user_id;",
      );

      expect(posts.length).toBe(2);
      expect(posts[0].user_id).toBe(1);
      expect(posts[0].title).toBe("First Post");
      expect(posts[0].content).toBe("This is Alice first post");
      expect(posts[1].user_id).toBe(2);
      expect(posts[1].title).toBe("Welcome Post");
      expect(posts[1].content).toBe("Bob welcomes everyone");

      // Step 13: Verify that migration IDs follow the monotonically increasing, zero-padded format
      const allMigrationRecords = await executeD1SQL(
        {
          accountId: api.accountId,
          databaseId: updatedDatabase.id,
          api: api,
          migrationsFiles: [],
          migrationsTable: legacyMigrationsTable,
        },
        `SELECT id, name FROM ${legacyMigrationsTable} ORDER BY id;`,
      );

      const migrationRecords = allMigrationRecords.result[0].results as Array<{
        id: string;
        name: string;
      }>;

      // Verify we have all expected migrations
      expect(migrationRecords.length).toBe(6);

      // Extract the IDs and verify they follow the expected pattern
      const migrationIds = migrationRecords.map((r) => r.id);

      // All IDs should be 5-digit zero-padded numbers
      for (const id of migrationIds) {
        expect(id).toMatch(/^\d{5}$/);
      }

      // IDs should be sequential starting from 00001
      expect(migrationIds[0]).toBe("00001");
      expect(migrationIds[1]).toBe("00002");
      expect(migrationIds[2]).toBe("00003");
      expect(migrationIds[3]).toBe("00004");
      expect(migrationIds[4]).toBe("00005");
      expect(migrationIds[5]).toBe("00006");

      // Step 14: Add another migration file and verify ID continues sequentially
      await fs.writeFile(
        path.join(tempDir, "0006_add_more_data.sql"),
        `INSERT INTO posts (user_id, title, content) VALUES 
          (1, 'Second Post', 'Alice second post'),
          (2, 'Another Post', 'Bob another post');`,
      );

      // Step 15: Apply the additional migration
      const finalDatabase = await D1Database(legacyMigrationDb, {
        name: legacyMigrationDb,
        migrationsDir: tempDir,
        migrationsTable: legacyMigrationsTable,
        adopt: true,
      });

      // Step 16: Verify the final migration ID continues the sequence
      const finalMigrationRecords = await executeD1SQL(
        {
          accountId: api.accountId,
          databaseId: finalDatabase.id,
          api: api,
          migrationsFiles: [],
          migrationsTable: legacyMigrationsTable,
        },
        `SELECT id, name FROM ${legacyMigrationsTable} ORDER BY id;`,
      );

      const finalRecords = finalMigrationRecords.result[0].results as Array<{
        id: string;
        name: string;
      }>;

      expect(finalRecords.length).toBe(7);

      // The last migration should have ID 00007
      const lastRecord = finalRecords[finalRecords.length - 1];
      expect(lastRecord.id).toBe("00007");
      expect(lastRecord.name).toBe("0006_add_more_data.sql");
    } finally {
      // Clean up temporary directory
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn("Failed to clean up temp directory:", cleanupError);
        }
      }

      // Clean up database through Alchemy's destroy
      await destroy(scope);

      // If we created a database manually but Alchemy destroy didn't handle it, clean it up
      if (databaseId) {
        try {
          await deleteDatabase(api, databaseId);
        } catch (cleanupError) {
          console.warn(
            "Failed to clean up manually created database:",
            cleanupError,
          );
        }
      }
    }
  }, 120000); // Extended timeout for complex migration operations
});

async function getResults(
  api: CloudflareApi,
  database: D1Database,
  sql: string,
): Promise<any[]> {
  // this query is eventually consistent, so we need to retry
  // TODO(sam): can we use a D1 Session to ensure strong consistency?
  for (let i = 0; i < 10; i++) {
    // Verify the cloned data exists in the target database
    const resp = await api.post(
      `/accounts/${api.accountId}/d1/database/${database.id}/query`,
      {
        sql,
      },
    );

    const data: any = await resp.json();
    const results = data.result?.[0]?.results || [];
    if (results.length > 0) {
      return results;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Failed to get results from database");
}

async function assertDatabaseDeleted(database: D1Database) {
  const api = await createCloudflareApi();
  try {
    if (!database.id) {
      throw new Error("Database ID is undefined");
    }

    // Try to list databases and check if our database is still there
    const databases = await listDatabases(api);
    const foundDatabase = databases.find((db) => db.id === database.id);

    if (foundDatabase) {
      throw new Error(`Database ${database.name} was not deleted as expected`);
    }
  } catch (error: any) {
    // If we get a 404, the database was deleted
    if (error.status === 404) {
      return; // This is expected
    } else {
      throw new Error(`Unexpected error type: ${error}`);
    }
  }
}
