import { Scope } from "./scope.ts";
import type { State } from "./state.ts";

export type StateCommand = "tree" | "list" | "get";

interface StateNode {
  resources: string[];
  children: Record<string, StateNode>;
}

async function walk(scope: Scope): Promise<StateNode> {
  const resources = await scope.state.list();
  const children: Record<string, StateNode> = {};
  if (typeof scope.state.listScopes === "function") {
    const childNames = await scope.state.listScopes();
    for (const name of childNames) {
      const childScope = new Scope({ parent: scope, scopeName: name });
      children[name] = await walk(childScope);
    }
  }
  return { resources, children };
}

function renderTree(rootName: string, node: StateNode): string {
  const lines: string[] = [rootName];
  appendNode(lines, node, "");
  return lines.join("\n");
}

function appendNode(lines: string[], node: StateNode, indent: string) {
  const childEntries = Object.entries(node.children).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const resources = [...node.resources].sort();
  const total = resources.length + childEntries.length;
  let i = 0;
  for (const r of resources) {
    const last = i === total - 1;
    lines.push(`${indent}${last ? "└─" : "├─"} ${r}`);
    i++;
  }
  for (const [name, child] of childEntries) {
    const last = i === total - 1;
    lines.push(`${indent}${last ? "└─" : "├─"} ${name}`);
    appendNode(lines, child, `${indent}${last ? "   " : "│  "}`);
    i++;
  }
}

function flatten(prefix: string[], node: StateNode, out: string[]) {
  for (const r of [...node.resources].sort()) {
    out.push([...prefix, r].join("/"));
  }
  for (const [name, child] of Object.entries(node.children).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    flatten([...prefix, name], child, out);
  }
}

/**
 * Run an `alchemy state` subcommand against the configured state store
 * and exit. Invoked by `alchemy.ts` when the user's program is launched
 * via `alchemy state ...` — the user's resources are never created.
 */
export async function runStateCommand(
  scope: Scope,
  command: StateCommand,
  arg?: string,
): Promise<never> {
  if (command === "get") {
    const fqn = arg;
    if (!fqn) {
      console.error("alchemy state get: missing resource fqn");
      return process.exit(1);
    }
    const state = await findByFqn(scope, fqn);
    if (state === undefined) {
      console.log(`(not found: ${fqn})`);
      return process.exit(1);
    }
    console.log(JSON.stringify(state, replacer, 2));
    return process.exit(0);
  }

  const node = await walk(scope);

  if (command === "list") {
    const out: string[] = [];
    flatten(scope.chain, node, out);
    if (out.length === 0) {
      console.log("(no resources)");
    } else {
      for (const fqn of out) console.log(fqn);
    }
    return process.exit(0);
  }

  // tree
  const rootName = scope.chain.join("/");
  if (node.resources.length === 0 && Object.keys(node.children).length === 0) {
    console.log(`${rootName}\n(empty)`);
    return process.exit(0);
  }
  console.log(renderTree(rootName, node));
  return process.exit(0);
}

async function findByFqn(
  scope: Scope,
  fqn: string,
): Promise<State | undefined> {
  const parts = fqn.split("/").filter(Boolean);
  // Strip leading chain (app/stage/...) if user passed full fqn
  const chain = scope.chain;
  let path = parts;
  if (parts.length > chain.length && chain.every((c, i) => c === parts[i])) {
    path = parts.slice(chain.length);
  }
  if (path.length === 0) return undefined;
  let current: Scope = scope;
  for (let i = 0; i < path.length - 1; i++) {
    current = new Scope({ parent: current, scopeName: path[i]! });
  }
  return current.state.get(path[path.length - 1]!);
}

function replacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return value.toString();
  if (value && typeof value === "object" && (value as any).type === "Buffer") {
    return "[Buffer]";
  }
  return value;
}
