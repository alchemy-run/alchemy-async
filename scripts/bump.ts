import { $ } from "bun";
import { generate } from "changelogithub";
import { readFile, writeFile } from "node:fs/promises";
// biome-ignore lint/style/noRestrictedImports: node:path in scripts is OK
import { join } from "node:path";

export async function generateReleaseNotes(tag: string) {
  console.log(`Generating release notes for version ${tag}`);
  const changelog = await generate({
    to: tag,
    emoji: true,
    contributors: true,
    repo: "alchemy-run/alchemy",
  });
  const fileContents = await readFile(
    join(process.cwd(), "CHANGELOG.md"),
    "utf-8",
  );
  if (fileContents.includes(tag)) {
    console.log(`Version ${tag} already exists in changelog, skipping`);
    return;
  }
  await writeFile(
    join(process.cwd(), "CHANGELOG.md"),
    `## ${tag}\n\n${changelog.md}\n\n---\n\n${fileContents}`,
  );
}

async function checkNpmVersion(
  packageName: string,
  version: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${packageName}/${version}`,
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function checkGithubTag(version: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/alchemy-run/alchemy/git/refs/tags/v${version}`,
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function checkGithubRelease(version: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/alchemy-run/alchemy/releases/tags/v${version}`,
    );
    return response.ok;
  } catch {
    return false;
  }
}

const versionInput = process.argv[2];

if (!versionInput) {
  console.error(
    "Please provide a version number or bump type (major, minor, patch)",
  );
  process.exit(1);
}

$.cwd(process.cwd());

const alchemyPackageJsonPath = join(process.cwd(), "alchemy", "package.json");
const alchemyPackageJson = JSON.parse(
  await readFile(alchemyPackageJsonPath, "utf-8"),
);

let newVersion = "";

// Check if it's a semantic version bump or a specific version
if (["major", "minor", "patch"].includes(versionInput)) {
  // Parse current version
  const currentVersion = alchemyPackageJson.version;
  const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!versionMatch) {
    console.error(`Invalid current version format: ${currentVersion}`);
    process.exit(1);
  }

  const [, major, minor, patch] = versionMatch.map(Number);

  // Calculate new version based on bump type
  switch (versionInput) {
    case "major":
      newVersion = `${major + 1}.0.0`;
      break;
    case "minor":
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case "patch":
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    default:
      throw new Error(`Invalid bump type: ${versionInput}`);
  }

  console.log(
    `Bumping ${versionInput} version: ${currentVersion} → ${newVersion}`,
  );
} else {
  // Validate specific version format
  if (!/^\d+\.\d+\.\d+$/.test(versionInput)) {
    console.error(
      "Version must be in format x.y.z or use 'major', 'minor', 'patch'",
    );
    process.exit(1);
  }

  newVersion = versionInput;
  console.log(`Setting specific version: ${newVersion}`);
}

// Check if version already exists
const npmExists = await checkNpmVersion(alchemyPackageJson.name, newVersion);
if (npmExists) {
  console.error(`Version ${newVersion} already exists on npm`);
  process.exit(1);
}

const githubTagExists = await checkGithubTag(newVersion);
if (githubTagExists) {
  console.error(`Tag v${newVersion} already exists on GitHub`);
  process.exit(1);
}

const githubReleaseExists = await checkGithubRelease(newVersion);
if (githubReleaseExists) {
  console.error(`Release v${newVersion} already exists on GitHub`);
  process.exit(1);
}

alchemyPackageJson.version = newVersion;
await writeFile(
  alchemyPackageJsonPath,
  `${JSON.stringify(alchemyPackageJson, null, 2)}\n`,
);

await $`bun install`;

console.log(`Updated version to ${newVersion} in package.json`);

// Generate build date for the release
console.log("Generating Workers compatibility date...");
await $`cd alchemy && bun ./scripts/generate-compatibility-date.ts`;

await $`git add package.json alchemy/package.json alchemy/src/cloudflare/compatibility-date.gen.ts bun.lock`;
await $`git commit -m "chore(release): ${newVersion}"`;
await $`git tag v${newVersion}`;

await generateReleaseNotes(`v${newVersion}`);

await $`git add CHANGELOG.md`;
await $`git commit --amend --no-edit`;
await $`git tag -d v${newVersion}`;

console.log(`Bumped version to ${newVersion} and generated release notes`);
