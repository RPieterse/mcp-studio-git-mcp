import { describe, expect, test } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(here, "../dist/index.js");

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "git-mcp-smoke-"));
  execSync("git init -q -b main", { cwd: dir });
  execSync("git config user.email test@example.com", { cwd: dir });
  execSync("git config user.name Test", { cwd: dir });
  writeFileSync(join(dir, "README.md"), "hello\n");
  return dir;
}

describe("git MCP — real stdio smoke", () => {
  test("status against a fresh repo returns ## main and an untracked README", async () => {
    const repo = makeRepo();
    let client: Client | undefined;
    try {
      const transport = new StdioClientTransport({
        command: "node",
        args: [serverEntry],
      });
      client = new Client({ name: "smoke", version: "0" });
      await client.connect(transport);
      const result = await client.callTool({
        name: "status",
        arguments: { cwd: repo },
      });
      const text = (result.content as Array<{ text: string }>)[0]!.text;
      expect(text).toMatch(/^## (No commits yet on )?main/);
      expect(text).toContain("?? README.md");
    } finally {
      if (client) await client.close().catch(() => {});
      rmSync(repo, { recursive: true, force: true });
    }
  }, 20_000);
});
