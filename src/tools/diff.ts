import { runCmd } from "./exec-helper.js";
import type { ExecFn, ToolResult } from "./types.js";

export async function gitDiff(
  input: { cwd: string; staged?: boolean; paths?: string[] },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  const args = ["diff"];
  if (input.staged) args.push("--staged");
  if (input.paths && input.paths.length > 0) {
    args.push("--", ...input.paths);
  }
  return runCmd(deps.exec, "git", args, input.cwd);
}
