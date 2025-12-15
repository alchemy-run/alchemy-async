import { readJson, writeJson } from "fs-extra";
import { join } from "pathe";
import { exists } from "../../src/util/exists.ts";

export async function ensureVibeRulesPostinstall(
  cwd: string,
  editor: string,
): Promise<void> {
  try {
    const packageJsonPath = join(cwd, "package.json");
    if (!(await exists(packageJsonPath))) return;

    const packageJson = await readJson(packageJsonPath);

    const postinstallCmd = `vibe-rules install ${editor}`;

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    if (packageJson.scripts.postinstall) {
      if (!packageJson.scripts.postinstall.includes("vibe-rules install")) {
        packageJson.scripts.postinstall = `${packageJson.scripts.postinstall} && ${postinstallCmd}`;
      }
    } else {
      packageJson.scripts.postinstall = postinstallCmd;
    }

    await writeJson(packageJsonPath, packageJson, { spaces: 2 });
  } catch (_err) {}
}
