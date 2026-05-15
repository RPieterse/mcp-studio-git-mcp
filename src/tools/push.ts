import { runCmd } from "./exec-helper.js";
import type { ExecFn, ToolResult } from "./types.js";

export async function gitPush(
  input: {
    cwd: string;
    remote?: string;
    branch?: string;
    set_upstream?: boolean;
    force?: boolean;
  },
  deps: { exec: ExecFn },
): Promise<ToolResult> {
  const args = ["push"];
  if (input.set_upstream) args.push("-u");
  if (input.force) args.push("--force-with-lease");
  if (input.remote) {
    args.push(input.remote);
    if (input.branch) args.push(input.branch);
  } else if (input.branch) {
    return {
      text: "branch requires a remote",
      isError: true,
    };
  }
  return runCmd(deps.exec, "git", args, input.cwd);
}
