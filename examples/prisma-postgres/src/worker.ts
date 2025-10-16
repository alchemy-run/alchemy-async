import { Client } from "pg";
import type { worker } from "../alchemy.run.ts";

export default {
  async fetch(_request: Request, env: typeof worker.Env): Promise<Response> {
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString,
    });

    try {
      // Connect to the database
      await client.connect();
      console.log("Connected to PostgreSQL database");

      // Perform a simple query
      const result = await client.query("SELECT * FROM pg_tables");

      return Response.json({
        success: true,
        result: result.rows,
      });
    } catch (error: any) {
      console.error("Database error:", error.message);

      return new Response("Internal error occurred", { status: 500 });
    }
  },
};
