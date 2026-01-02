import alchemy from "alchemy";
import {
  Project,
  Service,
  PostgresDatabase,
  Domain,
  Variable,
} from "alchemy/railway";

const app = await alchemy("railway-example");

// Create a Railway project
const project = await Project("my-project", {
  name: `${app.name}-${app.stage}`,
  description: "Railway example with Alchemy",
});

console.log(`Created project: ${project.name} (${project.id})`);

// Deploy a PostgreSQL database
const db = await PostgresDatabase("db", {
  project,
  name: `${app.name}-postgres`,
});

console.log(`Created database: ${db.name} (${db.id})`);
console.log(`Database host: ${db.host}`);

// Deploy an nginx service as a simple web server
const web = await Service("web", {
  project,
  name: `${app.name}-web`,
  source: {
    image: "nginx:alpine",
  },
});

console.log(`Created service: ${web.name} (${web.id})`);

// Get the production environment
const productionEnv = project.environments[0];

if (productionEnv) {
  // Add database URL as environment variable
  await Variable("db-url", {
    project,
    environment: productionEnv.id,
    service: web,
    name: "DATABASE_URL",
    value: db.connectionUrl,
  });

  // Create a public domain for the web service
  const domain = await Domain("web-domain", {
    service: web,
    environment: productionEnv.id,
  });

  console.log(`Web service available at: https://${domain.domain}`);
}

await app.finalize();
