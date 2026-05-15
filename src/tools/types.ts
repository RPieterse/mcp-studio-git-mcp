export type ExecFn = (
  command: string,
  args: string[],
  options: { cwd: string },
) => Promise<{ stdout: string; stderr: string; code: number }>;

export type ToolResult = { text: string; isError?: boolean };
