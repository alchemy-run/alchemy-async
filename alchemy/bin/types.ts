import z from "zod";

export const TEMPLATE_DEFINITIONS = [
  { name: "hono", description: "Hono" },
  { name: "vite", description: "React Vite" },
  { name: "bun-spa", description: "Bun SPA" },
  { name: "astro", description: "Astro SSR" },
  { name: "react-router", description: "React Router" },
  { name: "sveltekit", description: "SvelteKit" },
  { name: "tanstack-start", description: "TanStack Start" },
  { name: "rwsdk", description: "Redwood SDK" },
  { name: "nextjs", description: "Next.js" },
  { name: "nuxt", description: "Nuxt.js" },
  { name: "typescript", description: "TypeScript Worker" },
] as const;

export type TemplateType = (typeof TEMPLATE_DEFINITIONS)[number]["name"];

export const TemplateSchema = z.enum(
  TEMPLATE_DEFINITIONS.map((t) => t.name) as [TemplateType, ...TemplateType[]],
);

export const PackageManagerSchema = z
  .enum(["bun", "npm", "pnpm", "yarn", "deno"])
  .describe("Package manager");
export type PackageManager = z.infer<typeof PackageManagerSchema>;

export const ProjectNameSchema = z
  .string()
  .min(1, "Project name cannot be empty")
  .max(255, "Project name must be less than 255 characters")
  .refine(
    (name) => name === "." || !name.startsWith("."),
    "Project name cannot start with a dot (except for '.')",
  )
  .refine(
    (name) => name === "." || !name.startsWith("-"),
    "Project name cannot start with a dash",
  )
  .refine((name) => {
    const invalidChars = ["<", ">", ":", '"', "|", "?", "*"];
    return !invalidChars.some((char) => name.includes(char));
  }, "Project name contains invalid characters")
  .refine(
    (name) => name.toLowerCase() !== "node_modules",
    "Project name is reserved",
  )
  .describe("Project name or path");
export type ProjectName = z.infer<typeof ProjectNameSchema>;

export interface ProjectContext {
  name: string;
  path: string;
  template: TemplateType;
  packageManager: PackageManager;
  isTest: boolean;
  options: CreateInput;
}

export interface WebsiteOptions {
  entrypoint?: string;
  tsconfig?: string;
  scripts?: Record<string, string>;
  include?: string[];
  types?: string[];
  devDependencies?: string[];
  dependencies?: string[];
}

export type CreateInput = {
  name?: string;
  template?: TemplateType;
  pm?: PackageManager;
  yes?: boolean;
  overwrite?: boolean;
  install?: boolean;
  vibeRules?: EditorType;
  githubActions?: boolean;
  git?: boolean;
};

export type CLIInput = CreateInput & {
  projectDirectory?: string;
};

export type InstallInput = {
  editor: EditorType;
  packageManager?: PackageManager;
  cwd?: string;
};

export const EditorSchema = z
  .enum([
    "cursor",
    "windsurf",
    "vscode",
    "zed",
    "claude-code",
    "gemini",
    "codex",
    "amp",
    "clinerules",
    "roo",
    "unified",
  ])
  .describe("Editor for vibe-rules");
export type EditorType = z.infer<typeof EditorSchema>;

export type InitContext = {
  cwd: string;
  framework: TemplateType;
  useTypeScript: boolean;
  projectName: string;
  hasPackageJson: boolean;
  packageManager: PackageManager;
  main?: string;
};
