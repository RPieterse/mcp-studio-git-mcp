import { describe, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitStatus } from "../src/tools/status.js";

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "git-mcp-status-"));
}

describe("gitStatus", () => {
  test("invokes `git status --porcelain=v1 -b` in the cwd", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "## main\n M foo.txt\n", stderr: "", code: 0 });
      const result = await gitStatus({ cwd: dir }, { exec });
      expect(exec).toHaveBeenCalledWith(
        "git",
        ["status", "--porcelain=v1", "-b"],
        { cwd: dir },
      );
      expect(result.isError).toBeFalsy();
      expect(result.text).toContain("## main");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("surfaces a non-zero exit (e.g., not a git repo) as an error", async () => {
    const dir = tmpDir();
    try {
      const exec = vi.fn().mockResolvedValue({
        stdout: "",
        stderr: "fatal: not a git repository",
        code: 128,
      });
      const result = await gitStatus({ cwd: dir }, { exec });
      expect(result.isError).toBe(true);
      expect(result.text).toContain("not a git repository");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects when cwd does not exist", async () => {
    const exec = vi.fn();
    const result = await gitStatus(
      { cwd: "/this/path/does/not/exist/zzz" },
      { exec },
    );
    expect(result.isError).toBe(true);
    expect(exec).not.toHaveBeenCalled();
  });
});
