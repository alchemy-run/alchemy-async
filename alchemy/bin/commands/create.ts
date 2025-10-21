import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import { rm } from "fs-extra";
import { resolve } from "pathe";
import pc from "picocolors";
import z from "zod";
import { detectPackageManager } from "../../src/util/detect-package-manager.ts";
import { exists } from "../../src/util/exists.ts";
import { throwWithContext } from "../errors.ts";
import { initializeGitRepo, isGitInstalled } from "../services/git.ts";
import { addGitHubWorkflowToAlchemy } from "../services/github-workflow.ts";
import { installDependencies } from "../services/package-manager.ts";
import { copyTemplate } from "../services/template-manager.ts";
import { ensureVibeRulesPostinstall } from "../services/vibe-rules.ts";
import { ExitSignal, loggedProcedure } from "../trpc.ts";
import type {
  CreateInput,
  EditorType,
  ProjectContext,
  TemplateType,
} from "../types.ts";
import {
  EditorSchema,
  PackageManagerSchema,
  ProjectNameSchema,
  TEMPLATE_DEFINITIONS,
  TemplateSchema,
} from "../types.ts";

const isTest = process.env.NODE_ENV === "test";

export const create = loggedProcedure
  .meta({
    description: "create a new alchemy project",
    negateBooleans: true,
  })
  .input(
    z.tuple([
      ProjectNameSchema.optional(),
      z.object({
        template: TemplateSchema.optional(),
        yes: z.boolean().optional().describe("skip prompts and use defaults"),
        overwrite: z
          .boolean()
          .optional()
          .describe("overwrite existing directory"),
        install: z
          .boolean()
          .optional()
          .describe("install dependencies after scaffolding"),
        pm: PackageManagerSchema.optional().describe("package manager to use"),
        vibeRules: EditorSchema.optional().describe(
          "setup vibe-rules for the specified editor",
        ),
        githubActions: z
          .boolean()
          .optional()
          .describe("setup github actions for PR previews"),
        git: z.boolean().optional().describe("initialise a git repository"),
      }),
    ]),
  )
  .mutation(async ({ input }) => {
    const [name, options] = input;
    const isTest = process.env.NODE_ENV === "test";
    const combinedInput: CreateInput = {
      name,
      ...options,
      yes: isTest || options.yes,
    };
    await createAlchemy(combinedInput);
  });

async function createAlchemy(cliOptions: CreateInput): Promise<void> {
  try {
    intro(pc.cyan("🧪 Welcome to Alchemy!"));

    const context = await createProjectContext(cliOptions);

    await handleDirectoryOverwrite(context);
    await initializeTemplate(context);
    await setupVibeRules(context);
    await setupGitHubActions(context);
    await setupGit(context);

    displayNextSteps(context);
    displaySuccessMessage(context);
  } catch (error) {
    handleError(error);
  }
}

async function createProjectContext(
  cliOptions: CreateInput,
): Promise<ProjectContext> {
  const detectedPm = await detectPackageManager();
  const options = { yes: isTest, ...cliOptions };

  const name = await getProjectName(options);
  const selectedTemplate = await getSelectedTemplate(options);
  const packageManager = options.pm || detectedPm;
  const shouldInstall = await getInstallPreference(options, packageManager);

  const path = resolve(process.cwd(), name);

  return {
    name,
    path,
    template: selectedTemplate,
    packageManager,
    isTest,
    options: {
      ...options,
      install: shouldInstall,
    },
  };
}

async function getProjectName(options: CreateInput): Promise<string> {
  if (options.name) {
    return options.name;
  }

  if (options.yes) {
    return "my-alchemy-app";
  }

  const nameResult = await text({
    message: "What is your project name?",
    placeholder: "my-alchemy-app",
    validate: (value) => {
      const result = ProjectNameSchema.safeParse(value);
      if (!result.success) {
        return result.error.issues[0]?.message || "Invalid project name";
      }
      return undefined;
    },
  });

  if (isCancel(nameResult)) {
    cancel(pc.red("Operation cancelled."));
    throw new ExitSignal(0);
  }

  return nameResult;
}

async function getSelectedTemplate(
  options: CreateInput,
): Promise<TemplateType> {
  if (options.template) {
    return options.template;
  }

  if (options.yes) {
    return "typescript";
  }

  const templateResult = await select({
    message: "Which template would you like to use?",
    options: TEMPLATE_DEFINITIONS.map((t) => ({
      label: t.description,
      value: t.name as TemplateType,
    })),
  });

  if (isCancel(templateResult)) {
    cancel(pc.red("Operation cancelled."));
    throw new ExitSignal(0);
  }

  return templateResult;
}

async function getInstallPreference(
  options: CreateInput,
  packageManager: string,
): Promise<boolean> {
  if (options.install !== undefined) {
    return options.install;
  }

  if (options.yes) {
    return true;
  }

  const installResult = await confirm({
    message: `Install dependencies? ${pc.cyan(packageManager)}`,
    initialValue: true,
  });

  if (isCancel(installResult)) {
    cancel(pc.red("Operation cancelled."));
    throw new ExitSignal(0);
  }

  return installResult;
}

async function handleDirectoryOverwrite(
  context: ProjectContext,
): Promise<void> {
  if (!(await exists(context.path))) {
    return;
  }

  const shouldOverwrite = await getShouldOverwrite(context);

  if (!shouldOverwrite) {
    cancel(pc.red("Operation cancelled."));
    throw new ExitSignal(0);
  }

  await removeExistingDirectory(context);
}

async function getShouldOverwrite(context: ProjectContext): Promise<boolean> {
  if (context.options.overwrite) {
    log.warn(
      `Directory ${pc.yellow(context.name)} already exists. Overwriting due to ${pc.cyan("--overwrite")} flag.`,
    );
    return true;
  }

  const overwriteResult = await confirm({
    message: `Directory ${pc.yellow(context.name)} already exists. Overwrite?`,
    initialValue: false,
  });

  if (isCancel(overwriteResult)) {
    cancel(pc.red("Operation cancelled."));
    throw new ExitSignal(0);
  }

  return overwriteResult;
}

async function removeExistingDirectory(context: ProjectContext): Promise<void> {
  const s = spinner();
  s.start(`Removing existing directory: ${pc.yellow(context.path)}`);

  try {
    await rm(context.path, { recursive: true, force: true });
    s.stop(`Directory ${pc.yellow(context.path)} removed.`);
  } catch (error) {
    s.stop(pc.red(`Failed to remove directory ${pc.yellow(context.path)}.`));
    throwWithContext(error, "Directory removal failed");
  }
}

async function initializeTemplate(context: ProjectContext): Promise<void> {
  const templateDefinition = TEMPLATE_DEFINITIONS.find(
    (t) => t.name === context.template,
  );

  if (!templateDefinition) {
    throw new Error(`Template definition not found for: ${context.template}`);
  }

  try {
    await copyTemplate(context.template, context);
  } catch (error) {
    throwWithContext(
      error,
      `Template initialization failed for '${context.template}'`,
    );
  }
}

async function setupVibeRules(context: ProjectContext): Promise<void> {
  const selectedEditor = await getSelectedEditor(context);

  if (!selectedEditor) {
    return;
  }

  const s = spinner();
  s.start("Configuring vibe-rules...");

  try {
    await ensureVibeRulesPostinstall(context.path, selectedEditor);
    await installDependencies(context, {
      devDependencies: ["vibe-rules"],
    });
    // we need to install dependencies to trigger the postinstall script
    await installDependencies(context);
    s.stop("vibe-rules configured");
  } catch (error) {
    s.stop("Failed to configure vibe-rules");
    throwWithContext(error, "Failed to configure vibe-rules");
  }
}

async function getSelectedEditor(
  context: ProjectContext,
): Promise<EditorType | undefined> {
  let selectedEditor: EditorType | undefined = context.options.vibeRules;

  if (!selectedEditor && !context.isTest && !context.options.yes) {
    const setupResult = await confirm({
      message: "Setup vibe-rules for AI development assistance?",
      initialValue: true,
    });

    if (isCancel(setupResult) || !setupResult) {
      return undefined;
    }

    const editorResult = await select({
      message: "Which editor would you like to configure?",
      options: [
        { label: "Cursor", value: "cursor" },
        { label: "Windsurf", value: "windsurf" },
        { label: "VSCode", value: "vscode" },
        { label: "Zed", value: "zed" },
        { label: "Claude Code", value: "claude-code" },
        { label: "Gemini", value: "gemini" },
        { label: "Codex", value: "codex" },
        { label: "Amp", value: "amp" },
        { label: "Cline Rules", value: "clinerules" },
        { label: "Roo", value: "roo" },
        { label: "Unified (.rules)", value: "unified" },
      ],
    });

    if (isCancel(editorResult)) {
      return undefined;
    }

    selectedEditor = editorResult;
  }

  return selectedEditor;
}

async function setupGitHubActions(context: ProjectContext): Promise<void> {
  const shouldSetup = await getShouldSetupGitHubActions(context);

  if (!shouldSetup) {
    return;
  }

  try {
    await addGitHubWorkflowToAlchemy(context);
  } catch (error) {
    throwWithContext(error, "GitHub workflow setup failed");
  }
}

async function getShouldSetupGitHubActions(
  context: ProjectContext,
): Promise<boolean> {
  let shouldSetupGitHub = context.options.githubActions;

  if (
    shouldSetupGitHub === undefined &&
    !context.isTest &&
    !context.options.yes
  ) {
    const setupResult = await confirm({
      message: "Add GitHub Actions for PR previews?",
      initialValue: true,
    });

    if (isCancel(setupResult) || !setupResult) {
      return false;
    }

    shouldSetupGitHub = true;
  }

  return shouldSetupGitHub ?? false;
}

async function setupGit(context: ProjectContext): Promise<void> {
  const gitAvailable = await isGitInstalled();

  if (!gitAvailable) {
    log.warn("Git is not installed. Skipping git initialisation.");
    return;
  }

  const shouldInit = await getShouldInitGit(context);

  if (!shouldInit) {
    return;
  }

  const s = spinner();
  s.start("Initialising git repository...");

  try {
    await initializeGitRepo(context);
    s.stop("Git repository initialised.");
  } catch (error) {
    s.stop(pc.red("Failed to initialise git repository"));
    throwWithContext(error, "Git initialisation failed");
  }
}

async function getShouldInitGit(context: ProjectContext): Promise<boolean> {
  let shouldInit = context.options.git;

  if (shouldInit === undefined && !context.isTest && !context.options.yes) {
    const initResult = await confirm({
      message: "Initialise a git repository?",
      initialValue: true,
    });

    if (isCancel(initResult) || !initResult) {
      return false;
    }
    shouldInit = initResult;
  }

  return shouldInit ?? false;
}

function displayNextSteps(context: ProjectContext): void {
  const installInstructions =
    context.options.install === false
      ? `
${pc.cyan("📦 Install dependencies:")}
   ${context.packageManager} install
`
      : "";

  note(
    `
${pc.cyan("📁 Navigate to your project:")}
   cd ${context.name}

${installInstructions}${pc.cyan("🚀 Deploy your project:")}
   ${context.packageManager} run deploy

${pc.cyan("🧹 Destroy your project:")}
   ${context.packageManager} run destroy

${pc.cyan("📚 Learn more:")}
   https://alchemy.run
`,
    "Next Steps:",
  );
}

function displaySuccessMessage(context: ProjectContext): void {
  outro(
    pc.green(`✅ Project ${pc.yellow(context.name)} created successfully!`),
  );
}

function handleError(error: unknown): void {
  if (error instanceof Error) {
    throwWithContext(error, "Project creation failed");
  } else {
    throwWithContext(new Error(String(error)), "Project creation failed");
  }
}
