import { describe, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitAdd, gitCommit } from "../src/tools/commit.js";

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "git-mcp-commit-"));
}

describe("gitAdd", () => {
  test("calls `git add <paths>` in cwd", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitAdd({ cwd: dir, paths: ["a.ts", "b.ts"] }, { exec });
      expect(exec).toHaveBeenCalledWith("git", ["add", "a.ts", "b.ts"], {
        cwd: dir,
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects empty paths array (refuses to default to .)", async () => {
    const dir = tmpDir();
    try {
      const exec = vi.fn();
      const result = await gitAdd({ cwd: dir, paths: [] }, { exec });
      expect(result.isError).toBe(true);
      expect(exec).not.toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("gitCommit", () => {
  test("calls `git commit -m <message>` in cwd", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "[main abcdef] msg", stderr: "", code: 0 });
      await gitCommit({ cwd: dir, message: "Fix UI" }, { exec });
      expect(exec).toHaveBeenCalledWith("git", ["commit", "-m", "Fix UI"], {
        cwd: dir,
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects empty message", async () => {
    const dir = tmpDir();
    try {
      const exec = vi.fn();
      const result = await gitCommit({ cwd: dir, message: "" }, { exec });
      expect(result.isError).toBe(true);
      expect(exec).not.toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
