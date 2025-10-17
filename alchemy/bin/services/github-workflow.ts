/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: we are building a github template workflow */
import { spinner } from "@clack/prompts";
import { ensureDir, readFile, writeFile } from "fs-extra";
import path from "pathe";
import YAML from "yaml";
import { throwWithContext } from "../errors.ts";
import type { ProjectContext } from "../types.ts";
import { PackageManager } from "./package-manager.ts";

export async function addGitHubWorkflowToAlchemy(
  context: ProjectContext,
): Promise<void> {
  const alchemyFilePath = path.join(context.path, "alchemy.run.ts");

  const s = spinner();
  s.start("Setting up GitHub Actions...");

  try {
    const workflowDir = path.join(context.path, ".github", "workflows");
    await ensureDir(workflowDir);

    const pmCommands =
      PackageManager[context.packageManager] ?? PackageManager.bun;
    const installCmd = pmCommands.install;
    const runCmd = pmCommands.run;

    // Get the current Node.js major version
    const nodeVersion = process.version.match(/^v(\d+)/)?.[1] || "22";

    const installRuntime =
      context.packageManager === "bun"
        ? {
            name: "Setup Bun",
            uses: "oven-sh/setup-bun@v1",
            with: { "bun-version": "latest" },
          }
        : context.packageManager === "deno"
          ? {
              name: "Setup Deno",
              uses: "denoland/setup-deno@v1",
              with: { "deno-version": "v1.x" },
            }
          : {
              name: "Setup Node.js",
              uses: "actions/setup-node@v4",
              with: {
                "node-version": nodeVersion,
                ...(context.packageManager === "pnpm" ||
                context.packageManager === "yarn"
                  ? { cache: context.packageManager }
                  : {}),
              },
            };

    const installAdditionalPackageManager =
      context.packageManager === "pnpm"
        ? [
            {
              name: "Setup pnpm",
              uses: "pnpm/action-setup@v3",
              with: { version: "9" },
            },
          ]
        : [];

    const installDependencies = {
      name: "Install dependencies",
      shell: "bash",
      run: installCmd,
    };

    await writeFile(
      path.join(workflowDir, "pr-preview.yml"),
      YAML.stringify({
        name: "Preview",
        on: {
          pull_request: {
            types: ["opened", "reopened", "synchronize", "closed"],
          },
        },
        concurrency: {
          group: "pr-preview-${{ github.event.pull_request.number }}",
          "cancel-in-progress": false,
        },
        jobs: {
          "deploy-preview": {
            if: "${{ github.event.action != 'closed' }}",
            "runs-on": "ubuntu-latest",
            permissions: {
              contents: "read",
              "pull-requests": "write",
            },
            steps: [
              { uses: "actions/checkout@v4" },
              installRuntime,
              ...installAdditionalPackageManager,
              installDependencies,
              {
                name: "Deploy Preview",
                run: `${runCmd} deploy --stage pr-\${{ github.event.pull_request.number }}`,
                env: {
                  GITHUB_SHA: "${{ github.event.pull_request.head.sha }}",
                  GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
                  GITHUB_REPOSITORY_OWNER: "${{ github.repository_owner }}",
                  GITHUB_REPOSITORY_NAME: "${{ github.event.repository.name }}",
                  PULL_REQUEST: "${{ github.event.pull_request.number }}",
                  CLOUDFLARE_EMAIL: "${{ secrets.CLOUDFLARE_EMAIL }}",
                  CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}",
                  CLOUDFLARE_ACCOUNT_ID: "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
                  ALCHEMY_PASSWORD: "${{ secrets.ALCHEMY_PASSWORD }}",
                  ALCHEMY_STATE_TOKEN: "${{ secrets.ALCHEMY_STATE_TOKEN }}",
                },
              },
            ],
          },
          "cleanup-preview": {
            if: "${{ github.event.action == 'closed' }}",
            "runs-on": "ubuntu-latest",
            permissions: {
              contents: "read",
              "pull-requests": "write",
            },
            steps: [
              { uses: "actions/checkout@v4" },
              installRuntime,
              ...installAdditionalPackageManager,
              installDependencies,
              {
                name: "Cleanup Preview",
                run: `${runCmd} destroy`,
                env: {
                  GITHUB_SHA: "${{ github.event.pull_request.head.sha }}",
                  GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
                  GITHUB_REPOSITORY_OWNER: "${{ github.repository_owner }}",
                  GITHUB_REPOSITORY_NAME: "${{ github.event.repository.name }}",
                  PULL_REQUEST: "${{ github.event.pull_request.number }}",
                  CLOUDFLARE_EMAIL: "${{ secrets.CLOUDFLARE_EMAIL }}",
                  CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}",
                  CLOUDFLARE_ACCOUNT_ID: "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
                  ALCHEMY_PASSWORD: "${{ secrets.ALCHEMY_PASSWORD }}",
                  ALCHEMY_STATE_TOKEN: "${{ secrets.ALCHEMY_STATE_TOKEN }}",
                },
              },
            ],
          },
        },
      } as const),
    );
    await writeFile(
      path.join(workflowDir, "publish.yml"),
      YAML.stringify({
        name: "Publish",
        on: {
          push: {
            branches: ["main"],
          },
        },
        concurrency: {
          group: "publish",
          "cancel-in-progress": false,
        },
        jobs: {
          publish: {
            "runs-on": "ubuntu-latest",
            permissions: {
              contents: "read",
            },
            steps: [
              { uses: "actions/checkout@v4" },
              context.packageManager === "bun"
                ? {
                    name: "Setup Bun",
                    uses: "oven-sh/setup-bun@v1",
                    with: { "bun-version": "latest" },
                  }
                : context.packageManager === "deno"
                  ? {
                      name: "Setup Deno",
                      uses: "denoland/setup-deno@v1",
                      with: { "deno-version": "v1.x" },
                    }
                  : {
                      name: "Setup Node.js",
                      uses: "actions/setup-node@v4",
                      with: {
                        "node-version": nodeVersion,
                        ...(context.packageManager === "pnpm" ||
                        context.packageManager === "yarn"
                          ? { cache: context.packageManager }
                          : {}),
                      },
                    },
              ...(context.packageManager === "pnpm"
                ? [
                    {
                      name: "Setup pnpm",
                      uses: "pnpm/action-setup@v3",
                      with: { version: "9" },
                    },
                  ]
                : []),
              { name: "Install dependencies", shell: "bash", run: installCmd },
              {
                name: "Deploy to Production",
                run: `${runCmd} deploy`,
                env: {
                  STAGE: "prod",
                  GITHUB_SHA: "${{ github.sha }}",
                  GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
                  CLOUDFLARE_EMAIL: "${{ secrets.CLOUDFLARE_EMAIL }}",
                  CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}",
                  CLOUDFLARE_ACCOUNT_ID: "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
                  ALCHEMY_PASSWORD: "${{ secrets.ALCHEMY_PASSWORD }}",
                  ALCHEMY_STATE_TOKEN: "${{ secrets.ALCHEMY_STATE_TOKEN }}",
                },
              },
            ],
          },
        },
      } as const),
    );

    let code = await readFile(alchemyFilePath, "utf-8");

    const alchemyImportRegex = /(import alchemy from "alchemy";)/;
    const alchemyImportMatch = code.match(alchemyImportRegex);
    if (alchemyImportMatch) {
      const githubImport = `\nimport { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";`;
      code = code.replace(alchemyImportRegex, `$1${githubImport}`);
    }

    const lastImportRegex = /import[^;]+from[^;]+;(\s*\n)*/g;
    let lastImportMatch;

    while ((lastImportMatch = lastImportRegex.exec(code)) !== null) {
      lastImportMatch.index + lastImportMatch[0].length;
    }

    const appCallRegex = /const app = await alchemy\("([^"]+)"\);/;
    const appMatch = code.match(appCallRegex);
    if (appMatch) {
      const appName = appMatch[1];
      code = code.replace(
        appCallRegex,
        `const app = await alchemy("${appName}", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});`,
      );
    }

    const finalizeRegex = /(await app\.finalize\(\);)/;
    const finalizeMatch = code.match(finalizeRegex);
    if (finalizeMatch) {
      const githubWorkflowCode = `
if (process.env.PULL_REQUEST) {
  const previewUrl = worker.url;
  
  await GitHubComment("pr-preview-comment", {
    owner: process.env.GITHUB_REPOSITORY_OWNER || "your-username",
    repository: process.env.GITHUB_REPOSITORY_NAME || "${context.name}",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: \`
## 🚀 Preview Deployed

Your preview is ready! 

**Preview URL:** \${previewUrl}

This preview was built from commit \${process.env.GITHUB_SHA}

---
<sub>🤖 This comment will be updated automatically when you push new commits to this PR.</sub>\`,
  });
}

`;

      code = code.replace(finalizeRegex, `${githubWorkflowCode}$1`);
    }

    await writeFile(alchemyFilePath, code, "utf-8");

    s.stop("GitHub Actions configured");
  } catch (error) {
    s.stop("GitHub Actions setup failed");
    throwWithContext(error, "Failed to add GitHub workflow setup");
  }
}
