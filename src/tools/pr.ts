import { runCmd } from "./exec-helper.js";
import type { ExecFn, ToolResult } from "./types.js";

export async function prCreate(
  input: { cwd: string; title: string; body: string },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  const title = input.title?.trim();
  if (!title) return { text: "title must be non-empty", isError: true };
  return runCmd(
    deps.exec,
    "gh",
    ["pr", "create", "--title", title, "--body", input.body ?? ""],
    input.cwd,
  );
}

export async function prComment(
  input: { cwd: string; number: number; body: string },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  if (!Number.isInteger(input.number) || input.number <= 0) {
    return { text: "number must be a positive integer", isError: true };
  }
  return runCmd(
    deps.exec,
    "gh",
    ["pr", "comment", String(input.number), "--body", input.body ?? ""],
    input.cwd,
  );
}
