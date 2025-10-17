import {
  detectPackageManager,
  type PackageManager,
} from "./detect-package-manager.ts";

export class PeerDependencyError extends Error {
  constructor(input: {
    feature?: string;
    missing: string[];
    packageManager?: PackageManager;
  }) {
    super(
      [
        `Missing peer ${input.missing.length} ${
          input.missing.length === 1 ? "dependency" : "dependencies"
        }${input.feature ? ` for ${input.feature}` : ""}:`,
        ...input.missing.map((dep) => `- "${dep}"`),
        "",
        "Please install with:",
        `  ${input.packageManager ?? "npm"} install ${input.missing.join(" ")}`,
      ].join("\n"),
    );
  }
}

const extractPackageName = (error: unknown) => {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : undefined;
  const match = message?.match(/Cannot find (package|module) '([^']+)'/);
  return match?.[2];
};

export async function importPeer<T>(promise: Promise<T>, feature?: string) {
  try {
    return await promise;
  } catch (err) {
    const name = extractPackageName(err);
    if (!name) {
      throw err;
    }
    const packageManager = await detectPackageManager();
    const error = new PeerDependencyError({
      feature,
      missing: [name],
      packageManager,
    });
    Error.captureStackTrace(error, importPeer);
    throw error;
  }
}
