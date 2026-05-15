import { existsSync, statSync } from "node:fs";
import type { ExecFn, ToolResult } from "./types.js";

export async function runCmd(
  exec: ExecFn,
  command: string,
  args: string[],
  cwd: string,
): Promise<ToolResult> {
  if (!existsSync(cwd) || !statSync(cwd).isDirectory()) {
    return { text: `cwd does not exist: ${cwd}`, isError: true };
  }
  const { stdout, stderr, code } = await exec(command, args, { cwd });
  if (code !== 0) {
    return {
      text: stderr || stdout || `${command} exited ${code}`,
      isError: true,
    };
  }
  return { text: stdout };
}
