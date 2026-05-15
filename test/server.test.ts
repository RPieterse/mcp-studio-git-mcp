import { describe, expect, test, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../src/server.js";
import type { ExecFn } from "../src/tools/types.js";

async function connect(exec: ExecFn) {
  const server = createServer({ exec });
  const [c, s] = InMemoryTransport.createLinkedPair();
  await server.connect(s);
  const client = new Client({ name: "test", version: "0" });
  await client.connect(c);
  return client;
}

const TOOL_NAMES = [
  "status",
  "diff",
  "add",
  "commit",
  "branch",
  "push",
  "pr_create",
  "pr_comment",
];

describe("git MCP server", () => {
  test("advertises all expected tools", async () => {
    const exec = vi.fn();
    const client = await connect(exec);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
  });

  test("tools/call status delegates to gitStatus with injected exec", async () => {
    const dir = mkdtempSync(join(tmpdir(), "git-mcp-server-"));
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "## main", stderr: "", code: 0 });
      const client = await connect(exec);
      const result = await client.callTool({
        name: "status",
        arguments: { cwd: dir },
      });
      expect((result.content as Array<{ text: string }>)[0]!.text).toBe("## main");
      expect(exec).toHaveBeenCalledWith(
        "git",
        ["status", "--porcelain=v1", "-b"],
        { cwd: dir },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("tools/call pr_create delegates to prCreate", async () => {
    const dir = mkdtempSync(join(tmpdir(), "git-mcp-server-pr-"));
    try {
      const exec = vi.fn().mockResolvedValue({
        stdout: "https://github.com/x/y/pull/1",
        stderr: "",
        code: 0,
      });
      const client = await connect(exec);
      const result = await client.callTool({
        name: "pr_create",
        arguments: { cwd: dir, title: "T", body: "B" },
      });
      expect((result.content as Array<{ text: string }>)[0]!.text).toContain(
        "/pull/1",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects unknown tool names", async () => {
    const exec = vi.fn();
    const client = await connect(exec);
    await expect(
      client.callTool({ name: "wat", arguments: {} }),
    ).rejects.toThrow();
  });
});
