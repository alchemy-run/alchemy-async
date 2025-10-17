import fs from "node:fs/promises";
import path from "pathe";

export interface AlchemyRule {
  name: string;
  rule: string;
  description?: string;
  alwaysApply?: boolean;
  globs?: string | string[];
}

const alchemy: AlchemyRule = {
  name: "cloudflare",
  description: "Core Alchemy development guidelines and patterns",
  alwaysApply: true,
  globs: ["*.ts"],
  rule: await fs.readFile(
    path.join(import.meta.dirname, "llms.cloudflare.txt"),
    "utf-8",
  ),
};

const alchemyRules: AlchemyRule[] = [alchemy];

export default alchemyRules;
