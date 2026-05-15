import { runCmd } from "./exec-helper.js";
import type { ExecFn, ToolResult } from "./types.js";

export async function gitStatus(
  input: { cwd: string },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  return runCmd(
    deps.exec,
    "git",
    ["status", "--porcelain=v1", "-b"],
    input.cwd,
  );
}
