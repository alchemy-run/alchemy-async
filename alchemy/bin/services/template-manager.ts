import { log, spinner } from "@clack/prompts";
import { execa } from "execa";
import { globby } from "globby";
import path, { join } from "pathe";

import {
  copy,
  ensureDir,
  readFile,
  readJson,
  writeFile,
  writeJson,
} from "fs-extra";
import { exists } from "../../src/util/exists.ts";
import { PKG_ROOT } from "../constants.ts";
import { throwWithContext } from "../errors.ts";
import type { ProjectContext } from "../types.ts";
import { addPackageDependencies } from "./dependencies.ts";
import { installDependencies, PackageManager } from "./package-manager.ts";

export async function copyTemplate(
  templateName: string,
  context: ProjectContext,
): Promise<void> {
  const templatePath = path.join(PKG_ROOT, "templates", templateName);

  if (!(await exists(templatePath))) {
    throw new Error(`Template '${templateName}' not found at ${templatePath}`);
  }

  const filesToRename = [
    "_gitignore",
    "_npmrc",
    "_env",
    "_env.example",
    "_prettierignore",
  ];

  try {
    const s = spinner();
    s.start("Setting up project files...");

    const files = await globby("**/*", {
      cwd: templatePath,
      dot: true,
      followSymbolicLinks: false,
      gitignore: true,
    });

    for (const file of files) {
      const srcPath = join(templatePath, file);
      let destFile = file;

      const basename = path.basename(file);
      if (filesToRename.includes(basename)) {
        const newBasename = `.${basename.slice(1)}`;
        destFile = path.join(path.dirname(file), newBasename);
      }

      const destPath = join(context.path, destFile);

      await ensureDir(path.dirname(destPath));
      await copy(srcPath, destPath);
    }

    await substituteProjectName(context);

    await updateTemplatePackageJson(context);

    await addPackageDependencies({
      devDependencies: ["alchemy"],
      projectDir: context.path,
    });

    s.stop("Project files ready");

    if (context.options.install !== false) {
      const installSpinner = spinner();
      installSpinner.start("Installing dependencies...");
      try {
        await installDependencies(context);
        installSpinner.stop("Dependencies installed");
      } catch (error) {
        installSpinner.stop("Failed to install dependencies");
        throw error;
      }
    }

    if (templateName === "rwsdk") {
      await handleRwsdkPostInstall(context);
    }
  } catch (error) {
    throwWithContext(error, `Failed to copy template '${templateName}'`);
  }
}

async function substituteProjectName(context: ProjectContext): Promise<void> {
  const alchemyFile = join(context.path, "alchemy.run.ts");
  const code = await readFile(alchemyFile, "utf8");
  const newCode = code.replace("{projectName}", context.name);
  await writeFile(alchemyFile, newCode);
}

async function updateTemplatePackageJson(
  context: ProjectContext,
): Promise<void> {
  const packageJsonPath = join(context.path, "package.json");

  if (!(await exists(packageJsonPath))) {
    return;
  }

  const packageJson = await readJson(packageJsonPath);

  packageJson.name = context.name;

  if (packageJson.scripts) {
    packageJson.scripts.deploy = "alchemy deploy";
    packageJson.scripts.destroy = "alchemy destroy";
    packageJson.scripts.dev = "alchemy dev";
  }

  await writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function handleRwsdkPostInstall(context: ProjectContext): Promise<void> {
  try {
    const migrationsDir = join(context.path, "migrations");
    await ensureDir(migrationsDir);

    const commands = PackageManager[context.packageManager];
    const devInitCommand = `${commands.run} dev:init`;

    if (context.options.install !== false) {
      await execa(devInitCommand, {
        cwd: context.path,
        shell: true,
      });
    } else {
      log.info(
        `To complete rwsdk setup, run: cd ${context.name} && ${devInitCommand}`,
      );
    }
  } catch (_error) {
    log.warn(
      "Failed to complete rwsdk setup. You may need to run 'dev:init' manually.",
    );
  }
}
