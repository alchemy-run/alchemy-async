import { Listr, type ListrTask } from "listr2";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import fs, { access, mkdir, readdir, stat, unlink } from "node:fs/promises";
import path, { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";
import { AsyncMutex } from "../src/util/mutex.ts";

// Get the root directory of the project
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..", "..");
const alchemyDir = join(rootDir, "alchemy");
const examplesDir = join(rootDir, "examples");
const testsDir = join(rootDir, "tests");
const smokeDir = join(rootDir, "..", ".smoke");
const logsDir = join(rootDir, ".smoke.logs");

await fs.mkdir(logsDir, { recursive: true });

// Check for --no-capture flag
const noCaptureFlag = process.argv.includes("--no-capture");

const installMutex = new AsyncMutex();
const devMutex = new AsyncMutex();

await run("bun link", { cwd: alchemyDir, quiet: true });

const createVariants = {
  "typescript-template": "--template=typescript",
  "vite-template": "--template=vite",
  "astro-template": "--template=astro",
  "react-router-template": "--template=react-router",
  "sveltekit-template": "--template=sveltekit",
  "rwsdk-template": "--template=rwsdk",
  "tanstack-start-template": "--template=tanstack-start",
  "nextjs-template": "--template=nextjs",
  "nuxt-template": "--template=nuxt",
  "hono-template": "--template=hono",
};

const initVariants = {
  "vite-init": {
    scaffoldCommand: "bun create vite@latest {projectName} --template react-ts",
  },
  "sveltekit-init": {
    scaffoldCommand:
      "bunx sv create {projectName} --template minimal --types ts --no-add-ons --no-install",
  },
  "nuxt-init": {
    scaffoldCommand:
      "bun create nuxt@latest {projectName} --no-install --packageManager bun --gitInit --no-modules",
  },
  "astro-init": {
    scaffoldCommand: "bun create astro@latest {projectName} --yes",
  },
  "rwsdk-init": {
    scaffoldCommand: "bunx create-rwsdk {projectName}",
  },
  "tanstack-start-init": {
    scaffoldCommand:
      "bunx gitpick TanStack/router/tree/main/examples/react/start-basic {projectName}",
  },
  "react-router-init": {
    scaffoldCommand: "bunx create-react-router@latest {projectName} --yes",
  },
  "nextjs-init": {
    scaffoldCommand: "bun create next-app@latest {projectName} --yes",
  },
};

const skippedExamples = [
  "aws-app",
  // TODO(sam): re-enable. Right now it might be too slow and doesn't have dev mode
  "planetscale-drizzle",
  "planetscale-postgres",
  "docker",
  "cloudflare-orange",
];

// Discover examples and generate tests
const examples = (await discoverExamples()).filter(
  (e) => !skippedExamples.includes(e.name),
);

const exclude: string[] = [];
const include: string[] = [];
const fitlerTest = (name: string) =>
  (include.length === 0 || include.every((filter) => name.includes(filter))) &&
  (exclude.length === 0 || exclude.every((filter) => !name.includes(filter)));

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === "-t") {
    include.push(process.argv[i + 1]);
  } else if (process.argv[i] === "-x") {
    exclude.push(process.argv[i + 1]);
  }
}

// Filter examples based on test name if provided
const filteredExamples = examples.filter((e) =>
  fitlerTest(`example:${e.name}`),
);

const filteredInitVariants = Object.entries(initVariants).filter(([key]) =>
  fitlerTest(key),
);

const filteredCreateVariants = Object.entries(createVariants).filter(([key]) =>
  fitlerTest(key),
);

// Ensure smoke directory exists
if (!noCaptureFlag) {
  try {
    await mkdir(smokeDir, { recursive: true });
  } catch {
    // Directory might already exist, ignore
  }
}

const cliPath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "alchemy",
  "bin",
  "alchemy.ts",
);

// Create Listr tasks
const tasks = new Listr(
  [
    ...filteredCreateVariants.map(
      ([variantName, config]) =>
        ({
          title: variantName,
          task: async (_ctx, task) => {
            try {
              const projectPath = path.join(smokeDir, variantName);
              const exec = createExec(task, projectPath, variantName);

              await clearLog(variantName);
              await cleanupProject(projectPath);

              // serialize create scripts with any install steps (seems to make it more stable without much cost)
              await installMutex.lock(() =>
                exec(
                  `bun ${cliPath} create ${variantName} ${config} --no-install --no-git --github-actions --yes`,
                  {
                    cwd: smokeDir, // Run from smoke directory so project is created there
                    env: {
                      NODE_ENV: "test",
                    },
                  },
                ),
              );
              task.title = `${variantName} - Created`;
              await install(projectPath);
              // dev commands compete with each other for ports and vite dev seems to suck at resolving with them
              await devMutex.lock(() =>
                exec("bun alchemy dev --adopt", {
                  env: {
                    ALCHEMY_TEST_KILL_ON_FINALIZE: "1",
                  },
                }),
              );
              await exec("bun alchemy deploy --adopt");
              await exec("bun alchemy destroy");
              task.title = `${variantName} - ✅ Complete`;
            } catch (error: any) {
              task.title = `${variantName} - ❌ Failed ${error.message}`;
              throw new Error(task.title, {
                cause: error,
              });
            }
          },
        }) satisfies ListrTask,
    ),
    ...filteredInitVariants.map(
      ([variantName, config]) =>
        ({
          title: variantName,
          task: async (_ctx, task) => {
            const projectPath = path.join(smokeDir, variantName);
            const exec = createExec(task, projectPath, variantName);
            try {
              await clearLog(variantName);
              await cleanupProject(projectPath);
              await exec(
                config.scaffoldCommand.replace("{projectName}", variantName),
                {
                  cwd: smokeDir,
                },
              );
              await exec(`bun ${cliPath} init --yes`);
              task.title = `${variantName} - Initialized`;
              await install(projectPath);
              // dev commands compete with each other for ports and vite dev seems to suck at resolving with them
              await devMutex.lock(() =>
                exec("bun alchemy dev --adopt", {
                  env: {
                    ALCHEMY_TEST_KILL_ON_FINALIZE: "1",
                  },
                }),
              );
              await exec("bun alchemy deploy --adopt");
              await exec("bun alchemy destroy");
              task.title = `${variantName} - ✅ Complete`;
            } catch (error: any) {
              task.title = `${variantName} - ❌ Failed ${error.message}`;
              throw new Error(task.title, {
                cause: error,
              });
            }
          },
        }) satisfies ListrTask,
    ),
    ...filteredExamples.map(
      (example) =>
        ({
          title: example.name,
          task: async (_ctx, task) => {
            if (example.hasSmokeTestFile) {
              await run("bun smoke.test.ts", {
                cwd: example.path,
                exampleName: noCaptureFlag ? undefined : example.name,
                env: { DO_NOT_TRACK: "1" },
              });
              return;
            }

            let devCommand: string;
            let deployCommand: string;
            let destroyCommand: string;

            if (example.hasEnvFile) {
              // Use npm scripts if .env file exists in root
              devCommand = "bun run dev --adopt";
              deployCommand = "bun run deploy --adopt";
              destroyCommand = "bun run destroy";
            } else if (example.hasAlchemyRunFile) {
              // Use alchemy.run.ts if it exists
              devCommand = "bun tsx ./alchemy.run.ts --dev --adopt";
              deployCommand = "bun tsx ./alchemy.run.ts --adopt";
              destroyCommand = "bun tsx ./alchemy.run.ts --destroy";
            } else {
              // Fallback to index.ts
              devCommand = "bun ./index.ts --dev --adopt";
              deployCommand = "bun ./index.ts --adopt";
              destroyCommand = "bun ./index.ts --destroy";
            }

            const phases = [
              {
                title: "Cleanup",
                command: destroyCommand,
              },
              {
                title: "Dev",
                command: devCommand,
                env: {
                  // this is how we force alchemy to exit on finalize in CI
                  ALCHEMY_TEST_KILL_ON_FINALIZE: "1",
                },
              },
              {
                title: "Destroy",
                command: destroyCommand,
              },
              {
                title: "Dev",
                command: devCommand,
                env: {
                  // this is how we force alchemy to exit on finalize in CI
                  ALCHEMY_TEST_KILL_ON_FINALIZE: "1",
                },
              },
              {
                title: "Deploy",
                command: deployCommand,
              },
              {
                title: "Check",
                command: example.hasCheckCommand
                  ? "bun run check"
                  : "bun run build",
              },
              {
                title: "Destroy",
                command: destroyCommand,
              },
            ] as const;

            try {
              // Delete output file from previous run
              await deleteOutputFile(example.name);

              for (let i = 0; i < phases.length; i++) {
                const phase = phases[i];
                const exec = async () => {
                  task.title = `${example.name} - ${phase.title} ${pc.dim(`(${i}/${phases.length - 1})`)}`;
                  return run(phase.command, {
                    cwd: example.path,
                    exampleName: noCaptureFlag ? undefined : example.name,
                    // @ts-expect-error
                    env: { DO_NOT_TRACK: "1", ...phase.env },
                  });
                };

                if (phase.title === "Dev") {
                  task.title = `${example.name} - ${phase.title} (pending) ${pc.dim(`(${i}/${phases.length - 1})`)}`;
                  // await devMutex.lock(exec);
                  await exec();
                } else {
                  await exec();
                }
                await verifyNoLocalStateInCI(example.path);
              }

              // Task completed successfully
              task.title = `${example.name} - ✅ Complete`;
            } catch (error: any) {
              task.title = `${example.name} - ❌ Failed ${error.message}`;
              throw new Error(task.title, {
                cause: error,
              });
            }
          },
        }) satisfies ListrTask,
    ),
  ],
  {
    concurrent: true,
    exitOnError: false,
  },
);

try {
  await tasks.run();

  // Print summary
  const totalTests =
    filteredExamples.length +
    filteredInitVariants.length +
    filteredCreateVariants.length;
  const failedTasks = tasks.tasks.filter((task) => task.hasFailed());
  const passedCount = totalTests - failedTasks.length;
  const failedCount = failedTasks.length;

  console.log(`\n${"=".repeat(50)}`);
  console.log("SMOKE TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (passedCount > 0) {
    console.log(`\n✅ Passed tests (${passedCount}):`);
    tasks.tasks
      .filter((task) => !task.hasFailed())
      .forEach((task) => {
        const taskTitle = task.title ? String(task.title) : "Unknown";
        const exampleName = taskTitle.split(" - ")[0];
        console.log(`  ✅ ${exampleName}`);
      });
  }

  if (failedCount > 0) {
    console.log(`\n❌ Failed tests (${failedCount}):`);
    failedTasks.forEach((task) => {
      const taskTitle = task.title ? String(task.title) : "Unknown";
      const exampleName = taskTitle.split(" - ")[0];
      console.log(`  ❌ ${exampleName}`);
    });

    process.exit(1);
  } else {
    console.log("\n🎉 All tests passed!");
  }
} catch (error) {
  console.error("Failed to run smoke tests:", error);
  process.exit(1);
}

interface ExampleProject {
  name: string;
  path: string;
  hasEnvFile: boolean;
  hasAlchemyRunFile: boolean;
  hasIndexFile: boolean;
  hasCheckCommand: boolean;
  hasSmokeTestFile: boolean;
}

async function discoverExamples(): Promise<ExampleProject[]> {
  const examples: ExampleProject[] = [];

  try {
    const ls = (dir: string) =>
      readdir(dir).then((paths) => paths.map((p) => join(dir, p)));
    const entries = (
      await Promise.all([
        ls(examplesDir),
        process.argv.includes("--no-flatten") ? [] : ls(testsDir),
      ])
    ).flat();

    for (const p of entries) {
      const stats = await stat(p);

      if (stats.isDirectory()) {
        // Check for various files
        const envFilePath = join(rootDir, ".env");
        const alchemyRunPath = join(p, "alchemy.run.ts");
        const testPath = join(p, "smoke.test.ts");
        const indexPath = join(p, "index.ts");
        const pkgJson = await import(join(p, "package.json"));

        const hasEnvFile = await fileExists(envFilePath);
        const hasAlchemyRunFile = await fileExists(alchemyRunPath);
        const hasIndexFile = await fileExists(indexPath);
        const hasSmokeTestFile = await fileExists(testPath);

        examples.push({
          name: path.basename(p),
          path: p,
          hasEnvFile,
          hasAlchemyRunFile,
          hasIndexFile,
          hasCheckCommand: !!pkgJson.scripts?.check,
          hasSmokeTestFile,
        });
      }
    }
  } catch (error) {
    console.error("Failed to discover examples:", error);
    throw error;
  }

  return examples.sort((a, b) => a.name.localeCompare(b.name));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function deleteOutputFile(exampleName: string): Promise<void> {
  if (!noCaptureFlag) {
    const outputPath = join(logsDir, `${exampleName}.out`);
    try {
      await unlink(outputPath);
    } catch {
      // File might not exist, ignore
    }
  }
}

function stripAnsiColors(str: string): string {
  // Remove ANSI escape sequences
  return str.replace(/\u001b\[[0-9;]*m/g, "");
}

async function run(
  command: string,
  options: {
    cwd?: string;
    env?: Record<string, string>;
    exampleName?: string;
    append?: boolean;
    quiet?: boolean;
  } = {},
) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(/\s+/);
    const proc = spawn(cmd, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
        ALCHEMY_E2E: "1",
        DO_NOT_TRACK: "true",
      },
    });

    if (noCaptureFlag || !options.exampleName) {
      if (!options.quiet) {
        // Original behavior - stream to console
        proc.stdout?.on("data", (data) => {
          console.log(data.toString());
        });
        proc.stderr?.on("data", (data) => {
          console.error(data.toString());
        });
      }
    } else {
      // Stream to file
      if (!options.quiet) {
        const outputPath = join(logsDir, `${options.exampleName}.out`);
        const outputStream = createWriteStream(
          outputPath,
          options.append ? { flags: "a" } : undefined,
        );

        proc.stdout?.on("data", (data) => {
          const cleanData = stripAnsiColors(data.toString());
          outputStream.write(cleanData);
        });
        proc.stderr?.on("data", (data) => {
          const cleanData = stripAnsiColors(data.toString());
          outputStream.write(cleanData);
        });

        proc.on("close", () => {
          outputStream.end();
        });
      }
    }

    proc.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    proc.on("error", (error) => {
      reject(error);
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        const errorPrefix = options.exampleName
          ? `${options.exampleName} - `
          : "";
        reject(new Error(`${errorPrefix}Command failed with code ${code}`));
      }
    });
  });
}

async function log(name: string, message: string) {
  await fs.appendFile(join(logsDir, `${name}.out`), message);
}

async function install(projectPath: string) {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(projectPath, "package.json"), "utf-8"),
  );
  packageJson.devDependencies.alchemy = "link:alchemy";
  await fs.writeFile(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
  // having problems installing dependencies in parallel
  await installMutex.lock(async () => {
    await run("bun i", { cwd: projectPath, quiet: true });
  });
}

async function clearLog(variantName: string) {
  try {
    await fs.rm(join(logsDir, `${variantName}.out`), {
      recursive: true,
    });
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function cleanupProject(projectPath: string): Promise<void> {
  await fs.rm(projectPath, { recursive: true, force: true });
  // await fs.rm(projectPath, { recursive: true, force: true });
}

function createExec(
  task: {
    title: string;
  },
  projectPath: string,
  variantName: string,
) {
  return async function exec(
    cmd: string,
    options?: {
      cwd?: string;
      env?: Record<string, string>;
    },
  ) {
    task.title = `${variantName} > ${cmd}`;

    await log(variantName, `${cmd}\n`);

    await run(cmd, {
      cwd: options?.cwd ?? projectPath,
      env: {
        NODE_ENV: "test",
        DO_NOT_TRACK: "1",
        ...process.env,
        ...options?.env,
      },
      exampleName: `${variantName}`,
      append: true,
    });
  };
}

async function verifyNoLocalStateInCI(examplePath: string): Promise<void> {
  const alchemyDir = join(examplePath, ".alchemy");
  const isCloudflareStateStore =
    process.env.ALCHEMY_STATE_STORE === "cloudflare";
  const isCI = process.env.CI === "true";

  if (isCloudflareStateStore && isCI) {
    const alchemyDirExists = await fileExists(alchemyDir);

    if (alchemyDirExists) {
      throw new Error(
        ".alchemy/ directory exists when using Cloudflare state store in CI",
      );
    }
  }
}
