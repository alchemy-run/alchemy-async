import path from "pathe";

import { readJson, writeJson } from "fs-extra";
import {
  type DependencyVersionMap,
  dependencyVersionMap,
} from "../constants.ts";

export const addPackageDependencies = async (opts: {
  dependencies?: DependencyVersionMap[];
  devDependencies?: DependencyVersionMap[];
  projectDir: string;
}): Promise<void> => {
  const { dependencies = [], devDependencies = [], projectDir } = opts;

  const pkgJsonPath = path.join(projectDir, "package.json");

  const pkgJson = await readJson(pkgJsonPath);

  if (!pkgJson.dependencies) pkgJson.dependencies = {};
  if (!pkgJson.devDependencies) pkgJson.devDependencies = {};

  for (const pkgName of dependencies) {
    const version = dependencyVersionMap[pkgName];
    if (version) {
      pkgJson.dependencies[pkgName] = version;
    }
  }

  for (const pkgName of devDependencies) {
    const version = dependencyVersionMap[pkgName];
    if (version) {
      pkgJson.devDependencies[pkgName] = version;
    }
  }

  await writeJson(pkgJsonPath, pkgJson, {
    spaces: 2,
  });
};

export const addPackageDependency = addPackageDependencies;
