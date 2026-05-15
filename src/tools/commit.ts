import { runCmd } from "./exec-helper.js";
import type { ExecFn, ToolResult } from "./types.js";

export async function gitAdd(
  input: { cwd: string; paths: string[] },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  if (!input.paths || input.paths.length === 0) {
    return { text: "paths must be non-empty", isError: true };
  }
  return runCmd(deps.exec, "git", ["add", ...input.paths], input.cwd);
}

export async function gitCommit(
  input: { cwd: string; message: string },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  const message = input.message?.trim();
  if (!message) {
    return { text: "message must be non-empty", isError: true };
  }
  return runCmd(deps.exec, "git", ["commit", "-m", message], input.cwd);
}
