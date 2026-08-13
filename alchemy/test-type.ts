import type { VercelEnvironments } from "./src/vercel/vercel.types.ts";

// This should work - no duplicates
const valid: VercelEnvironments = ["production", "preview", "development"];

// This should fail - has duplicates
const invalid: VercelEnvironments = ["production", "preview", "development", "preview"];
