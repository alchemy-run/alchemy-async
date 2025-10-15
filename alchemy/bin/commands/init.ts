import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
} from "@clack/prompts";
import * as fs from "fs-extra";
import { parse as parseJsonc } from "jsonc-parse";
import { dirname, relative, resolve } from "node:path";
import pc from "picocolors";
import {
  IndentationText,
  Node,
  Project,
  QuoteKind,
  type CallExpression,
} from "ts-morph";
import z from "zod";
import { detectPackageManager } from "../../src/util/detect-package-manager.ts";
import type { DependencyVersionMap } from "../constants.ts";
import { throwWithContext } from "../errors.ts";
import { addPackageDependencies } from "../services/dependencies.ts";
import { ExitSignal, loggedProcedure } from "../trpc.ts";
import {
  TemplateSchema,
  type InitContext,
  type TemplateType,
} from "../types.ts";

export const init = loggedProcedure
  .meta({
    description: "initialize alchemy in an existing project",
  })
  .input(
    z.tuple([
      z.object({
        framework: TemplateSchema.optional().describe(
          "force a specific framework instead of auto-detection",
        ),
        yes: z.boolean().optional().describe("skip prompts and use defaults"),
      }),
    ]),
  )
  .mutation(async ({ input: [options] }) => {
    try {
      intro(pc.cyan("🧪 Initializing Alchemy in your project"));

      const context = await createInitContext(options);

      if (!context.hasPackageJson) {
        log.warn(
          "No package.json found. Please run in a project with package.json.",
        );
        throw new ExitSignal(1);
      }

      await checkExistingAlchemyFiles(context);
      const updatedConfig = await updateProjectConfiguration(context);
      await createAlchemyRunFile({
        ...context,
        main: updatedConfig?.main,
      });
      await updatePackageJson(context);
      await updateGitignore(context);

      displaySuccessMessage(context);
    } catch (_error) {
      console.error("Failed to initialize Alchemy:", _error);
      throw new ExitSignal(1);
    }
    // TODO(sam): adding this seemed to stop the CLI from hanging after success (which happens sometimes, not clear why)
    throw new ExitSignal(0);
  });

function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[@/]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 63)
    .replace(/-$/, "");
}

async function readJsonc(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return parseJsonc(content);
  } catch (error) {
    throw new Error(`Failed to read or parse ${filePath}: ${error}`);
  }
}

async function writeJsonWithSpaces(filePath: string, data: any): Promise<void> {
  await fs.writeJson(filePath, data, { spaces: 2 });
}

async function safelyUpdateJson(
  filePath: string,
  updater: (data: any) => void,
  fallbackData: any = {},
): Promise<void> {
  try {
    let data = fallbackData;
    if (await fs.pathExists(filePath)) {
      data = await readJsonc(filePath);
    }
    updater(data);
    await writeJsonWithSpaces(filePath, data);
  } catch (error) {
    console.warn(`Failed to update ${filePath}:`, error);
  }
}

async function createInitContext(options: {
  framework?: TemplateType;
  yes?: boolean;
}): Promise<InitContext> {
  const cwd = resolve(process.cwd());
  const packageJsonPath = resolve(cwd, "package.json");
  const hasPackageJson = await fs.pathExists(packageJsonPath);

  let projectName = "my-alchemy-app";
  if (hasPackageJson) {
    try {
      const packageJson = await readJsonc(packageJsonPath);
      if (packageJson?.name) {
        projectName = sanitizeProjectName(packageJson.name);
      }
    } catch (_error) {}
  }

  const useTypeScript = await fs.pathExists(resolve(cwd, "tsconfig.json"));
  const framework =
    options.framework ||
    (await detectFramework(cwd, hasPackageJson, options.yes));
  const packageManager = await detectPackageManager(cwd);

  return {
    cwd,
    framework,
    useTypeScript,
    projectName,
    hasPackageJson,
    packageManager,
  };
}

const FRAMEWORK_DETECTION_MAP: Record<string, TemplateType> = {
  rwsdk: "rwsdk",
  astro: "astro",
  next: "nextjs",
  nuxt: "nuxt",
  "react-router": "react-router",
  "@sveltejs/kit": "sveltekit",
  "@tanstack/react-start": "tanstack-start",
  vite: "vite",
};

async function detectFramework(
  cwd: string,
  hasPackageJson: boolean,
  skipPrompts?: boolean,
): Promise<TemplateType> {
  if (!hasPackageJson) {
    return "typescript";
  }

  const detectedFramework = await detectFrameworkFromPackageJson(cwd);

  if (skipPrompts) {
    return detectedFramework;
  }

  const frameworkResult = await select({
    message: "Which framework are you using?",
    options: [
      { label: "TypeScript Worker", value: "typescript" },
      { label: "Vite", value: "vite" },
      { label: "Astro", value: "astro" },
      { label: "React Router", value: "react-router" },
      { label: "SvelteKit", value: "sveltekit" },
      { label: "TanStack Start", value: "tanstack-start" },
      { label: "Redwood SDK", value: "rwsdk" },
      { label: "Nuxt.js", value: "nuxt" },
      { label: "Next.js", value: "nextjs" },
    ] as const,
    initialValue: detectedFramework,
  });

  if (isCancel(frameworkResult)) {
    cancel(pc.red("Operation cancelled."));
    throw new ExitSignal(0);
  }

  return frameworkResult as TemplateType;
}

async function detectFrameworkFromPackageJson(
  cwd: string,
): Promise<TemplateType> {
  const packageJsonPath = resolve(cwd, "package.json");

  try {
    const packageJson = await readJsonc(packageJsonPath);
    const allDeps = {
      ...packageJson?.dependencies,
      ...packageJson?.devDependencies,
      ...packageJson?.peerDependencies,
    };

    for (const [dep, framework] of Object.entries(FRAMEWORK_DETECTION_MAP)) {
      if (dep in allDeps) return framework;
    }

    return "typescript";
  } catch (_error) {
    return "typescript";
  }
}

async function checkExistingAlchemyFiles(context: InitContext): Promise<void> {
  const alchemyFiles = ["alchemy.run.ts", "alchemy.run.js"];
  const existingFile = alchemyFiles.find((file) =>
    fs.pathExistsSync(resolve(context.cwd, file)),
  );

  if (existingFile) {
    const overwriteResult = await confirm({
      message: `${pc.yellow(existingFile)} already exists. Overwrite?`,
      initialValue: false,
    });

    if (isCancel(overwriteResult) || !overwriteResult) {
      cancel(pc.red("Operation cancelled."));
      throw new ExitSignal(0);
    }
  }
}

const ALCHEMY_RUN_TEMPLATES: Record<
  Exclude<TemplateType, "hono">,
  (context: InitContext) => string
> = {
  typescript: (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const worker = await Worker("worker", {
  entrypoint: "src/worker.ts",
});

console.log(worker.url);
await app.finalize();
`,

  vite: (context) => `import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const worker = await Vite("${context.projectName}", {
  // replace if different from default:
  //
  // main: "./.output/server/index.mjs",
  // command: "vite build",
  // dev: { command: "vite dev" },
  assets: "dist"
});

console.log({
  url: worker.url,
});

await app.finalize();
`,

  astro: (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { Astro } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const worker = await Astro("website", {
  // replace if different from default:
  //
  // main: "./.output/server/index.mjs",
  // command: "astro build",
  // dev: { command: "astro dev" },
});

console.log({
  url: worker.url,
});

await app.finalize();
`,

  "react-router": (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { ReactRouter } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const worker = await ReactRouter("website", {
  // replace if different from default:
  //
  // main: "build/server/index.js",
  // command: "react-router build",
  // dev: { command: "react-router dev" },
  ${context.main ? `wrangler: { main: "${context.main}" },` : ""}
});

console.log({
  url: worker.url,
});

await app.finalize();
`,

  sveltekit: (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { SvelteKit } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const worker = await SvelteKit("website", {
  // replace if different from default:
  //
  // main: "./.output/server/index.mjs",
  // command: "RWSDK_DEPLOY=1 vite build",
  // dev: { command: "vite dev" },
});

console.log({
  url: worker.url,
});

await app.finalize();
`,

  "tanstack-start": (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const worker = await TanStackStart("website", {
  // replace if different from default:
  //
  // main: "./.output/server/index.mjs",
  // command: "RWSDK_DEPLOY=1 vite build",
  // dev: { command: "vite dev" },
});

console.log({
  url: worker.url,
});

await app.finalize();
`,

  rwsdk: (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { D1Database, DurableObjectNamespace, Redwood } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

const database = await D1Database("database", {
  migrationsDir: "migrations",
});

export const worker = await Redwood("website", {
  bindings: {
    AUTH_SECRET_KEY: alchemy.secret(process.env.AUTH_SECRET_KEY),
    DB: database,
    SESSION_DURABLE_OBJECT: DurableObjectNamespace("session", {
      className: "SessionDurableObject",
    }),
  },
  // replace if different from default:
  //
  // main: "./.output/server/index.mjs",
  // command: "RWSDK_DEPLOY=1 vite build",
  // dev: { command: "vite dev" },
});

console.log({
  url: worker.url,
});

await app.finalize();
`,

  nextjs: (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { Nextjs } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const website = await Nextjs("website", {
});

console.log({
  url: website.url,
});

await app.finalize();
`,

  nuxt: (context) => `/// <reference types="@types/node" />

import alchemy from "alchemy";
import { Nuxt } from "alchemy/cloudflare";

const app = await alchemy("${context.projectName}");

export const website = await Nuxt("website", {
  // replace if different from default:
  //
  // main: "./.output/server/index.mjs",
  // command: "nuxt build",
  // dev: { command: "nuxt dev" },
});

console.log({
  url: website.url,
});

await app.finalize();
`,
};

async function createAlchemyRunFile(context: InitContext): Promise<void> {
  try {
    const content = ALCHEMY_RUN_TEMPLATES[context.framework](context);
    const outputFileName = context.useTypeScript
      ? "alchemy.run.ts"
      : "alchemy.run.js";
    const outputPath = resolve(context.cwd, outputFileName);
    await fs.writeFile(outputPath, content, "utf-8");
  } catch (error) {
    throwWithContext(error, "Failed to create alchemy.run file");
  }
}

const FRAMEWORK_DEPENDENCIES: Record<TemplateType, DependencyVersionMap[]> = {
  nextjs: ["alchemy", "@opennextjs/cloudflare", "sharp"],
  hono: ["alchemy"],
  nuxt: ["alchemy", "nitro-cloudflare-dev"],
  sveltekit: ["alchemy", "@sveltejs/adapter-cloudflare"],
  typescript: ["alchemy"],
  vite: ["alchemy"],
  astro: ["alchemy", "@astrojs/cloudflare"],
  "react-router": ["alchemy", "@cloudflare/vite-plugin"],
  "tanstack-start": ["alchemy"],
  rwsdk: ["alchemy"],
};

const DEFAULT_SCRIPTS = {
  deploy: "alchemy deploy",
  destroy: "alchemy destroy",
  "alchemy:dev": "alchemy dev",
};

async function updatePackageJson(context: InitContext): Promise<void> {
  try {
    const devDependencies = FRAMEWORK_DEPENDENCIES[context.framework];
    await addPackageDependencies({
      devDependencies: [...devDependencies, "@cloudflare/workers-types"],
      projectDir: context.cwd,
    });

    const packageJsonPath = resolve(context.cwd, "package.json");
    await safelyUpdateJson(packageJsonPath, (packageJson) => {
      packageJson.type = "module";
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      for (const [script, command] of Object.entries(DEFAULT_SCRIPTS)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
        }
      }
    });
  } catch (error) {
    throwWithContext(error, "Failed to update package.json");
  }
}

async function updateGitignore(context: InitContext) {
  try {
    const gitignorePath = resolve(context.cwd, ".gitignore");

    await fs.ensureFile(gitignorePath);

    let gitignoreContent = "";
    if (await fs.pathExists(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, "utf-8");
    }

    const lines = gitignoreContent.split("\n").map((line) => line.trim());
    const hasDirectory = (dir: string) =>
      lines.some((line) => line === dir || line === `${dir}/`);

    if (!hasDirectory(".alchemy")) {
      lines.push("# alchemy", ".alchemy", "");
    }

    if (context.framework === "nextjs") {
      if (!hasDirectory(".next")) {
        lines.push("# next", ".next", "");
      }
      if (!hasDirectory(".open-next")) {
        lines.push("# open-next", ".open-next", "");
      }
      if (!lines.some((line) => line === "wrangler.jsonc")) {
        lines.push("# wrangler", "wrangler.jsonc", "");
      }
    }

    await fs.writeFile(gitignorePath, lines.join("\n"), "utf-8");
  } catch (error) {
    throwWithContext(error, "Failed to update .gitignore");
  }
}

interface TsConfigUpdate {
  include?: string[];
  exclude?: string[];
  compilerOptions?: {
    types?: string[];
  };
}

async function updateTsConfig(
  configPath: string,
  updates: TsConfigUpdate,
): Promise<void> {
  await safelyUpdateJson(configPath, (tsConfig) => {
    if (updates.include) {
      if (!tsConfig.include) tsConfig.include = [];
      updates.include.forEach((item) => {
        if (!tsConfig.include.includes(item)) {
          tsConfig.include.push(item);
        }
      });
    }

    if (updates.exclude) {
      if (tsConfig.include) {
        tsConfig.include = tsConfig.include.filter(
          (p: string) => !updates.exclude!.includes(p),
        );
      }
    }

    if (updates.compilerOptions?.types) {
      if (!tsConfig.compilerOptions) tsConfig.compilerOptions = {};
      if (!tsConfig.compilerOptions.types) tsConfig.compilerOptions.types = [];

      updates.compilerOptions.types.forEach((type) => {
        if (!tsConfig.compilerOptions.types.includes(type)) {
          tsConfig.compilerOptions.types.push(type);
        }
      });
    }
  });
}

async function updateProjectConfiguration(context: InitContext): Promise<{
  main: string | undefined;
} | void> {
  return {
    typescript: () => updateTypescriptProject(context),
    vite: () => updateViteProject(context),
    astro: () => updateAstroProject(context),
    "react-router": () => updateReactRouterProject(context),
    sveltekit: () => updateSvelteKitProject(context),
    "tanstack-start": () => updateTanStackStartProject(context),
    rwsdk: () => updateRwsdkProject(context),
    nuxt: () => updateNuxtProject(context),
    nextjs: () => updateNextjsProject(context),
  }[context.framework]();
}

async function updateTypescriptProject(context: InitContext): Promise<void> {
  const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  if (await fs.pathExists(tsConfigPath)) {
    await updateTsConfig(tsConfigPath, {
      include: ["alchemy.run.ts"],
    });
  }
}

async function updateViteProject(_context: InitContext): Promise<void> {
  // const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  // const tsConfigNodePath = resolve(context.cwd, "tsconfig.node.json");
  // if (await fs.pathExists(tsConfigPath)) {
  //   await updateTsConfig(tsConfigPath, {
  //     exclude: ["alchemy.run.ts", "./types/env.d.ts"],
  //   });
  // }
  // if ((await fs.pathExists(tsConfigNodePath)) || context.framework === "vite") {
  //   await updateTsConfig(tsConfigNodePath, {
  //     include: ["alchemy.run.ts"],
  //   });
  // }
}

async function updateSvelteKitProject(context: InitContext): Promise<void> {
  await updateSvelteConfig(context);

  // const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  // await updateTsConfig(tsConfigPath, {
  //   include: ["alchemy.run.ts"],
  // });
}

async function updateRwsdkProject(context: InitContext): Promise<void> {
  await updateEnvFile(context);

  // const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  // await updateTsConfig(tsConfigPath, {
  //   include: ["alchemy.run.ts"],
  // });
}

async function updateNuxtProject(context: InitContext): Promise<void> {
  await updateNuxtConfig(context);

  // const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  // await updateTsConfig(tsConfigPath, {
  //   include: ["alchemy.run.ts"],
  // });
}

async function updateAstroProject(context: InitContext): Promise<void> {
  await updateAstroConfig(context);

  // const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  // await updateTsConfig(tsConfigPath, {
  //   include: ["alchemy.run.ts", "types/**/*.ts"],
  //   compilerOptions: {
  //     types: ["@cloudflare/workers-types", "./types/env.d.ts"],
  //   },
  // });
}

async function updateNextjsProject(context: InitContext): Promise<void> {
  const resolveFile = async (name: string) => {
    const candidates = ["ts", "js", "cjs", "mjs"].map((ext) =>
      resolve(context.cwd, `${name}.${ext}`),
    );
    for (const candidate of candidates) {
      if (await fs.pathExists(candidate)) {
        return { path: candidate, exists: true };
      }
    }
    return { path: candidates[0], exists: false };
  };

  const nextConfig = await resolveFile("next.config");
  const openNextConfig = await resolveFile("open-next.config");

  if (nextConfig.exists) {
    const fileContent = await fs.readFile(nextConfig.path, "utf-8");
    let updated = fileContent;
    if (
      !fileContent.includes(
        "import { defineCloudflareConfig } from '@opennextjs/cloudflare'",
      )
    ) {
      updated = `import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";\n${fileContent}`;
    }
    if (!fileContent.includes("initOpenNextCloudflareForDev()")) {
      updated += "\ninitOpenNextCloudflareForDev();\n";
    }
    await fs.writeFile(nextConfig.path, updated);
  } else {
    await fs.writeFile(
      nextConfig.path,
      `import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

initOpenNextCloudflareForDev();
`,
    );
  }

  if (!openNextConfig.exists) {
    await fs.writeFile(
      openNextConfig.path,
      `import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Uncomment to enable R2 cache,
  // It should be imported as:
  // import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
  // See https://opennext.js.org/cloudflare/caching for more details
  // incrementalCache: r2IncrementalCache,
});
`,
    );
  }
  await fs.writeFile(
    resolve(context.cwd, "./env.d.ts"),
    `// Auto-generated Cloudflare binding types.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

import type { website } from "./alchemy.run.ts";

declare global {
	type CloudflareEnv = typeof website.Env;
}

declare module "cloudflare:workers" {
	namespace Cloudflare {
		export interface Env extends CloudflareEnv {}
	}
}`,
  );

  const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  await updateTsConfig(tsConfigPath, {
    compilerOptions: {
      types: ["@cloudflare/workers-types", "./env.d.ts"],
    },
  });
}

async function updateReactRouterProject(context: InitContext): Promise<{
  main: string | undefined;
}> {
  const tsConfigPath = resolve(context.cwd, "tsconfig.json");
  const workersDir = resolve(context.cwd, "workers");
  const wranglerJsonCPath = resolve(context.cwd, "wrangler.jsonc");
  const wranglerJsonPath = resolve(context.cwd, "wrangler.json");
  const envTsPath = resolve(workersDir, "env.ts");

  await fs.ensureDir(workersDir);

  let main: string | undefined;
  if (await fs.pathExists(wranglerJsonCPath)) {
    const wranglerJsonC = await readJsonc(wranglerJsonCPath);
    main = wranglerJsonC.main;
  } else if (await fs.pathExists(wranglerJsonPath)) {
    const wranglerJson = await readJsonc(wranglerJsonPath);
    main = wranglerJson.main;
  } else {
    await fs.writeFile(
      resolve(workersDir, "app.ts"),
      `
      import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
}
`,
    );
  }

  await fs.writeFile(
    envTsPath,
    `
    import type { website } from "../alchemy.run.ts";

export type CloudflareEnv = typeof website.Env;

declare global {
  type Env = CloudflareEnv
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}`,
  );

  await updateTsConfig(tsConfigPath, {
    include: ["alchemy.run.ts", "workers/**/*.ts"],
    compilerOptions: {
      types: [
        "@cloudflare/workers-types",
        relative(dirname(tsConfigPath), envTsPath),
      ],
    },
  });

  await updateViteConfig(context);
  await updateReactRouterConfigTS(context);

  return {
    main,
  };
}

async function updateViteConfig(context: InitContext): Promise<void> {
  const viteConfigPath = resolve(context.cwd, "vite.config.ts");
  if (!(await fs.pathExists(viteConfigPath))) return;

  try {
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Double,
      },
    });

    project.addSourceFileAtPath(viteConfigPath);
    const sourceFile = project.getSourceFileOrThrow(viteConfigPath);

    // Check if cloudflare import already exists
    const cloudflareImport = sourceFile.getImportDeclaration(
      "@cloudflare/vite-plugin",
    );
    const alchemyPlugin =
      {
        "react-router": "alchemy/cloudflare/react-router",
        "tanstack-start": "alchemy/cloudflare/tanstack-start",
        astro: "alchemy/cloudflare/astro",
        nuxt: "alchemy/cloudflare/nuxt",
        sveltekit: "alchemy/cloudflare/sveltekit",
      }[context.framework] ?? "alchemy/cloudflare/vite";
    if (!cloudflareImport) {
      // Add cloudflare import
      sourceFile.addImportDeclaration({
        moduleSpecifier: alchemyPlugin,
        defaultImport: "alchemy",
      });
    } else {
      cloudflareImport.setModuleSpecifier(alchemyPlugin);
    }

    // Find the defineConfig call
    const exportAssignment = sourceFile.getExportAssignment(
      (d) => !d.isExportEquals(),
    );
    if (!exportAssignment) return;

    const defineConfigCall = exportAssignment.getExpression();
    if (
      !Node.isCallExpression(defineConfigCall) ||
      defineConfigCall.getExpression().getText() !== "defineConfig"
    )
      return;

    let configObject = defineConfigCall.getArguments()[0];
    if (!configObject) {
      configObject = defineConfigCall.addArgument("{}");
    }

    if (Node.isObjectLiteralExpression(configObject)) {
      const pluginsProperty = configObject.getProperty("plugins");
      if (pluginsProperty && Node.isPropertyAssignment(pluginsProperty)) {
        const initializer = pluginsProperty.getInitializer();
        if (Node.isArrayLiteralExpression(initializer)) {
          // Check if cloudflare plugin is already configured
          const hasCloudflarePlugin = initializer
            .getElements()
            .some((el) => el.getText().includes("cloudflare("));

          if (!hasCloudflarePlugin) {
            // Add cloudflare plugin
            initializer.addElement("alchemy()");
          }
        }
      } else if (!pluginsProperty) {
        // If no plugins property exists, create one with cloudflare plugin
        configObject.addPropertyAssignment({
          name: "plugins",
          initializer: "[alchemy()]",
        });
      }
    }

    await project.save();
  } catch (error) {
    console.warn("Failed to update vite.config.ts:", error);
  }
}

async function updateReactRouterConfigTS(context: InitContext): Promise<void> {
  const configPath = resolve(context.cwd, "react-router.config.ts");
  if (!(await fs.pathExists(configPath))) return;

  try {
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Double,
      },
    });

    project.addSourceFileAtPath(configPath);
    const sourceFile = project.getSourceFileOrThrow(configPath);

    // Find the default export
    const exportAssignment = sourceFile.getExportAssignment(
      (d) => !d.isExportEquals(),
    );
    if (!exportAssignment) return;

    const configExpression = exportAssignment.getExpression();
    let configObject: Node | undefined;

    // Handle both direct object literal and satisfies expression
    if (Node.isObjectLiteralExpression(configExpression)) {
      configObject = configExpression;
    } else if (Node.isSatisfiesExpression(configExpression)) {
      const expression = configExpression.getExpression();
      if (Node.isObjectLiteralExpression(expression)) {
        configObject = expression;
      }
    }

    if (!configObject || !Node.isObjectLiteralExpression(configObject)) return;

    // Check if future property exists
    let futureProperty = configObject.getProperty("future");

    if (!futureProperty) {
      // Add future property with unstable_viteEnvironmentApi
      configObject.addPropertyAssignment({
        name: "future",
        initializer: `{
    unstable_viteEnvironmentApi: true,
  }`,
      });
    } else if (Node.isPropertyAssignment(futureProperty)) {
      // Future property exists, check if it has unstable_viteEnvironmentApi
      const futureInitializer = futureProperty.getInitializer();

      if (Node.isObjectLiteralExpression(futureInitializer)) {
        const viteEnvApiProp = futureInitializer.getProperty(
          "unstable_viteEnvironmentApi",
        );

        if (!viteEnvApiProp) {
          // Add unstable_viteEnvironmentApi
          futureInitializer.addPropertyAssignment({
            name: "unstable_viteEnvironmentApi",
            initializer: "true",
          });
        } else if (Node.isPropertyAssignment(viteEnvApiProp)) {
          // Check if it's false and update to true
          const value = viteEnvApiProp.getInitializer()?.getText();
          if (value === "false") {
            viteEnvApiProp.setInitializer("true");
          }
        }
      }
    }

    await project.save();
  } catch (error) {
    console.warn("Failed to update react-router.config.ts:", error);
  }
}

async function updateTanStackStartProject(context: InitContext): Promise<void> {
  await updateTanStackViteConfig(context);
  await updateEnvFile(context);
}

async function updateSvelteConfig(context: InitContext): Promise<void> {
  const svelteConfigPath = resolve(context.cwd, "svelte.config.js");
  if (!(await fs.pathExists(svelteConfigPath))) return;

  try {
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
      },
    });

    project.addSourceFileAtPath(svelteConfigPath);
    const sourceFile = project.getSourceFileOrThrow(svelteConfigPath);

    // Find and update the adapter import
    const importDeclarations = sourceFile.getImportDeclarations();
    const adapterImport = importDeclarations.find((imp) =>
      imp.getModuleSpecifierValue().includes("@sveltejs/adapter"),
    );

    if (adapterImport) {
      // Change the import to alchemy
      adapterImport.setModuleSpecifier("alchemy/cloudflare/sveltekit");
      // Remove old default import and add new one
      adapterImport.removeDefaultImport();
      adapterImport.setDefaultImport("alchemy");
    } else {
      // Add alchemy import if no adapter import exists
      sourceFile.insertImportDeclaration(0, {
        moduleSpecifier: "alchemy/cloudflare/sveltekit",
        defaultImport: "alchemy",
      });
    }

    // Find the config object
    const configVariable = sourceFile.getVariableDeclaration("config");
    if (configVariable) {
      const initializer = configVariable.getInitializer();
      if (Node.isObjectLiteralExpression(initializer)) {
        updateAdapterInConfig(initializer);
      }
    }

    await project.save();
  } catch (error) {
    console.warn("Failed to update svelte.config.js:", error);
  }
}

function updateAdapterInConfig(configObject: Node): void {
  if (!Node.isObjectLiteralExpression(configObject)) return;

  const kitProperty = configObject.getProperty("kit");
  if (kitProperty && Node.isPropertyAssignment(kitProperty)) {
    const kitInitializer = kitProperty.getInitializer();
    if (Node.isObjectLiteralExpression(kitInitializer)) {
      const adapterProperty = kitInitializer.getProperty("adapter");
      if (adapterProperty && Node.isPropertyAssignment(adapterProperty)) {
        const initializer = adapterProperty.getInitializer();
        if (Node.isCallExpression(initializer)) {
          const expression = initializer.getExpression();
          if (
            Node.isIdentifier(expression) &&
            expression.getText() === "adapter"
          ) {
            expression.replaceWithText("alchemy");
          }
        }
      }
    }
  }
}

async function updateEnvFile(context: InitContext): Promise<void> {
  const envPath = resolve(context.cwd, ".env");
  await fs.ensureFile(envPath);

  const envVars = ["ALCHEMY_PASSWORD=change-me"];
  if (context.framework === "rwsdk") {
    envVars.push("AUTH_SECRET_KEY=your-development-secret-key");
  }

  let envContent = "";
  if (await fs.pathExists(envPath)) {
    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch (error) {
      console.warn("Failed to read .env:", error);
    }
  }

  let needsUpdate = false;
  for (const envVar of envVars) {
    const [key] = envVar.split("=");
    if (!envContent.includes(`${key}=`)) {
      if (envContent && !envContent.endsWith("\n")) {
        envContent += "\n";
      }
      envContent += `${envVar}\n`;
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    try {
      await fs.writeFile(envPath, envContent, "utf-8");
    } catch (error) {
      console.warn("Failed to update .env:", error);
    }
  }
}

async function updateNuxtConfig(context: InitContext): Promise<void> {
  const nuxtConfigPath = resolve(context.cwd, "nuxt.config.ts");
  if (!(await fs.pathExists(nuxtConfigPath))) return;

  try {
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Double,
      },
    });

    project.addSourceFileAtPath(nuxtConfigPath);
    const sourceFile = project.getSourceFileOrThrow(nuxtConfigPath);

    const exportAssignment = sourceFile.getExportAssignment(
      (d) => !d.isExportEquals(),
    );
    if (!exportAssignment) return;

    const defineConfigCall = exportAssignment.getExpression();
    if (
      !Node.isCallExpression(defineConfigCall) ||
      defineConfigCall.getExpression().getText() !== "defineNuxtConfig"
    )
      return;

    let configObject = defineConfigCall.getArguments()[0];
    if (!configObject) {
      configObject = defineConfigCall.addArgument("{}");
    }

    if (Node.isObjectLiteralExpression(configObject)) {
      if (!configObject.getProperty("nitro")) {
        configObject.addPropertyAssignment({
          name: "nitro",
          initializer: `{
    preset: "cloudflare_module",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    }
  }`,
        });
      }

      const modulesProperty = configObject.getProperty("modules");
      if (modulesProperty && Node.isPropertyAssignment(modulesProperty)) {
        const initializer = modulesProperty.getInitializer();
        if (Node.isArrayLiteralExpression(initializer)) {
          const hasModule = initializer
            .getElements()
            .some(
              (el) =>
                el.getText() === '"nitro-cloudflare-dev"' ||
                el.getText() === "'nitro-cloudflare-dev'",
            );
          if (!hasModule) {
            initializer.addElement('"nitro-cloudflare-dev"');
          }
        }
      } else if (!modulesProperty) {
        configObject.addPropertyAssignment({
          name: "modules",
          initializer: '["nitro-cloudflare-dev"]',
        });
      }
    }

    await project.save();
  } catch (error) {
    console.warn("Failed to update nuxt.config.ts:", error);
  }
}

async function updateAstroConfig(context: InitContext): Promise<void> {
  const astroConfigPath = resolve(context.cwd, "astro.config.mjs");
  if (!(await fs.pathExists(astroConfigPath))) return;

  try {
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Double,
      },
    });

    project.addSourceFileAtPath(astroConfigPath);
    const sourceFile = project.getSourceFileOrThrow(astroConfigPath);

    sourceFile.addImportDeclaration({
      moduleSpecifier: "@astrojs/cloudflare",
      defaultImport: "cloudflare",
    });

    const exportAssignment = sourceFile.getExportAssignment(
      (d) => !d.isExportEquals(),
    );
    if (!exportAssignment) return;

    const defineConfigCall = exportAssignment.getExpression();
    if (
      !Node.isCallExpression(defineConfigCall) ||
      defineConfigCall.getExpression().getText() !== "defineConfig"
    )
      return;

    let configObject = defineConfigCall.getArguments()[0];
    if (!configObject) {
      configObject = defineConfigCall.addArgument("{}");
    }

    if (Node.isObjectLiteralExpression(configObject)) {
      if (!configObject.getProperty("output")) {
        configObject.addPropertyAssignment({
          name: "output",
          initializer: "'server'",
        });
      }
      if (!configObject.getProperty("adapter")) {
        configObject.addPropertyAssignment({
          name: "adapter",
          initializer: "cloudflare()",
        });
      }
    }

    await project.save();
  } catch (error) {
    console.warn("Failed to update astro.config.mjs:", error);
  }
}

async function updateTanStackViteConfig(context: InitContext): Promise<void> {
  const viteConfigPath = resolve(context.cwd, "vite.config.ts");
  if (!(await fs.pathExists(viteConfigPath))) return;

  try {
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Double,
      },
    });

    project.addSourceFileAtPath(viteConfigPath);
    const sourceFile = project.getSourceFileOrThrow(viteConfigPath);

    const alchemyImport = sourceFile.getImportDeclaration(
      "alchemy/cloudflare/tanstack-start",
    );
    if (!alchemyImport) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: "alchemy/cloudflare/tanstack-start",
        defaultImport: "alchemy",
      });
    } else {
      alchemyImport.setModuleSpecifier("alchemy/cloudflare/tanstack-start");
    }

    const exportAssignment = sourceFile.getExportAssignment(
      (d) => !d.isExportEquals(),
    );
    if (!exportAssignment) {
      throw new Error("vite.config.ts does not contain a default export");
    }

    let defineConfigCall: CallExpression | undefined;
    const exportExpression = exportAssignment.getExpression();

    // Check if it's a direct defineConfig call
    if (
      Node.isCallExpression(exportExpression) &&
      exportExpression.getExpression().getText() === "defineConfig"
    ) {
      defineConfigCall = exportExpression;
    }
    // Check if it's an alias (identifier) that references a defineConfig call
    else if (Node.isIdentifier(exportExpression)) {
      const variableName = exportExpression.getText();
      const variableDeclaration =
        sourceFile.getVariableDeclaration(variableName);

      if (variableDeclaration) {
        const initializer = variableDeclaration.getInitializer();
        if (
          Node.isCallExpression(initializer) &&
          initializer.getExpression().getText() === "defineConfig"
        ) {
          defineConfigCall = initializer;
        }
      }
    }

    if (!defineConfigCall) {
      throw new Error("vite.config.ts does not contain a defineConfig call");
    }

    let configObject = defineConfigCall.getArguments()[0];
    if (!configObject) {
      configObject = defineConfigCall.addArgument("{}");
    }

    if (Node.isObjectLiteralExpression(configObject)) {
      const pluginsProperty = configObject.getProperty("plugins");
      if (pluginsProperty && Node.isPropertyAssignment(pluginsProperty)) {
        const initializer = pluginsProperty.getInitializer();
        if (Node.isArrayLiteralExpression(initializer)) {
          const hasAlchemyPlugin = initializer
            .getElements()
            .some((el) => el.getText().includes("alchemy"));
          if (!hasAlchemyPlugin) {
            initializer.addElement("alchemy()");
          }
        }
      }
    }

    await project.save();
  } catch (error) {
    console.warn("Failed to update vite.config.ts:", error);
  }
}

function displaySuccessMessage(context: InitContext): void {
  const fileExtension = context.useTypeScript ? "ts" : "js";
  const runFile = `alchemy.run.${fileExtension}`;

  note(`${pc.cyan("📁 Files created:")}
   ${runFile} - Your infrastructure configuration

${pc.cyan("🚀 Next steps:")}
   Edit ${runFile} to configure your infrastructure
   Run ${pc.yellow(`${context.packageManager} run deploy`)} to deploy
   Run ${pc.yellow(`${context.packageManager} run destroy`)} to clean up

${pc.cyan("📚 Learn more:")}
   https://alchemy.run`);

  outro(pc.green("Alchemy initialized successfully!"));
}
