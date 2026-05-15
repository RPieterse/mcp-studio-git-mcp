import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { defaultExec } from "./exec.js";
import type { ExecFn, ToolResult } from "./tools/types.js";
import { gitStatus } from "./tools/status.js";
import { gitDiff } from "./tools/diff.js";
import { gitAdd, gitCommit } from "./tools/commit.js";
import { gitBranch } from "./tools/branch.js";
import { gitPush } from "./tools/push.js";
import { prCreate, prComment } from "./tools/pr.js";

const CWD = {
  type: "string" as const,
  description: "Absolute path to a working git repository.",
};

const TOOLS = [
  {
    name: "status",
    description: "Run `git status --porcelain=v1 -b`.",
    inputSchema: {
      type: "object" as const,
      properties: { cwd: CWD },
      required: ["cwd"],
      additionalProperties: false,
    },
  },
  {
    name: "diff",
    description: "Show git diff (optionally --staged or scoped to paths).",
    inputSchema: {
      type: "object" as const,
      properties: {
        cwd: CWD,
        staged: { type: "boolean" },
        paths: { type: "array", items: { type: "string" } },
      },
      required: ["cwd"],
      additionalProperties: false,
    },
  },
  {
    name: "add",
    description: "Stage one or more paths.",
    inputSchema: {
      type: "object" as const,
      properties: {
        cwd: CWD,
        paths: { type: "array", items: { type: "string" }, minItems: 1 },
      },
      required: ["cwd", "paths"],
      additionalProperties: false,
    },
  },
  {
    name: "commit",
    description: "Create a commit with the given message.",
    inputSchema: {
      type: "object" as const,
      properties: { cwd: CWD, message: { type: "string", minLength: 1 } },
      required: ["cwd", "message"],
      additionalProperties: false,
    },
  },
  {
    name: "branch",
    description: "List, create, or switch branches.",
    inputSchema: {
      type: "object" as const,
      properties: {
        cwd: CWD,
        action: { enum: ["list", "create", "switch"] },
        name: { type: "string" },
      },
      required: ["cwd", "action"],
      additionalProperties: false,
    },
  },
  {
    name: "push",
    description:
      "Push to a remote. Never uses --force; use force_with_lease only when force=true.",
    inputSchema: {
      type: "object" as const,
      properties: {
        cwd: CWD,
        remote: { type: "string" },
        branch: { type: "string" },
        set_upstream: { type: "boolean" },
        force: { type: "boolean" },
      },
      required: ["cwd"],
      additionalProperties: false,
    },
  },
  {
    name: "pr_create",
    description: "Open a pull request via `gh pr create`.",
    inputSchema: {
      type: "object" as const,
      properties: {
        cwd: CWD,
        title: { type: "string", minLength: 1 },
        body: { type: "string" },
      },
      required: ["cwd", "title", "body"],
      additionalProperties: false,
    },
  },
  {
    name: "pr_comment",
    description: "Comment on a pull request via `gh pr comment`.",
    inputSchema: {
      type: "object" as const,
      properties: {
        cwd: CWD,
        number: { type: "integer", minimum: 1 },
        body: { type: "string", minLength: 1 },
      },
      required: ["cwd", "number", "body"],
      additionalProperties: false,
    },
  },
];

function asContent(result: ToolResult) {
  return {
    content: [{ type: "text" as const, text: result.text }],
    isError: result.isError ?? false,
  };
}

export function createServer(opts: { exec?: ExecFn } = {}): Server {
  const exec = opts.exec ?? defaultExec;
  const server = new Server(
    { name: "git", version: "0.0.1" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const a = (req.params.arguments ?? {}) as Record<string, unknown>;
    const cwd = String(a.cwd ?? "");
    switch (req.params.name) {
      case "status":
        return asContent(await gitStatus({ cwd }, { exec }));
      case "diff":
        return asContent(
          await gitDiff(
            {
              cwd,
              staged: Boolean(a.staged),
              paths: (a.paths as string[] | undefined) ?? undefined,
            },
            { exec },
          ),
        );
      case "add":
        return asContent(
          await gitAdd({ cwd, paths: (a.paths as string[]) ?? [] }, { exec }),
        );
      case "commit":
        return asContent(
          await gitCommit({ cwd, message: String(a.message ?? "") }, { exec }),
        );
      case "branch":
        return asContent(
          await gitBranch(
            {
              cwd,
              action: a.action as "list" | "create" | "switch",
              name: a.name as string | undefined,
            },
            { exec },
          ),
        );
      case "push":
        return asContent(
          await gitPush(
            {
              cwd,
              remote: a.remote as string | undefined,
              branch: a.branch as string | undefined,
              set_upstream: Boolean(a.set_upstream),
              force: Boolean(a.force),
            },
            { exec },
          ),
        );
      case "pr_create":
        return asContent(
          await prCreate(
            { cwd, title: String(a.title ?? ""), body: String(a.body ?? "") },
            { exec },
          ),
        );
      case "pr_comment":
        return asContent(
          await prComment(
            {
              cwd,
              number: Number(a.number),
              body: String(a.body ?? ""),
            },
            { exec },
          ),
        );
      default:
        throw new Error(`Unknown tool: ${req.params.name}`);
    }
  });

  return server;
}
