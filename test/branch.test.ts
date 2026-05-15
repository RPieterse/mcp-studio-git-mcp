import { describe, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitBranch } from "../src/tools/branch.js";

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "git-mcp-branch-"));
}

describe("gitBranch", () => {
  test("action=list runs `git branch --list`", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "* main\n", stderr: "", code: 0 });
      await gitBranch({ cwd: dir, action: "list" }, { exec });
      expect(exec).toHaveBeenCalledWith("git", ["branch", "--list"], { cwd: dir });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("action=create runs `git checkout -b <name>`", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitBranch(
        { cwd: dir, action: "create", name: "fix/ui-issues" },
        { exec },
      );
      expect(exec).toHaveBeenCalledWith(
        "git",
        ["checkout", "-b", "fix/ui-issues"],
        { cwd: dir },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("action=switch runs `git switch <name>`", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitBranch({ cwd: dir, action: "switch", name: "main" }, { exec });
      expect(exec).toHaveBeenCalledWith("git", ["switch", "main"], { cwd: dir });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects create/switch without a branch name", async () => {
    const dir = tmpDir();
    try {
      const exec = vi.fn();
      const result = await gitBranch({ cwd: dir, action: "create" }, { exec });
      expect(result.isError).toBe(true);
      expect(exec).not.toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
