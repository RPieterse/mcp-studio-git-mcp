import { runCmd } from "./exec-helper.js";
import type { ExecFn, ToolResult } from "./types.js";

export async function gitBranch(
  input: { cwd: string; action: "list" | "create" | "switch"; name?: string },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  switch (input.action) {
    case "list":
      return runCmd(deps.exec, "git", ["branch", "--list"], input.cwd);
    case "create":
      if (!input.name) return { text: "name is required for create", isError: true };
      return runCmd(deps.exec, "git", ["checkout", "-b", input.name], input.cwd);
    case "switch":
      if (!input.name) return { text: "name is required for switch", isError: true };
      return runCmd(deps.exec, "git", ["switch", input.name], input.cwd);
    default:
      return { text: `unknown branch action: ${input.action}`, isError: true };
  }
}
