import { describe, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitDiff } from "../src/tools/diff.js";

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "git-mcp-diff-"));
}

describe("gitDiff", () => {
  test("defaults to working-tree diff (no --staged)", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "diff --git ...", stderr: "", code: 0 });
      await gitDiff({ cwd: dir }, { exec });
      expect(exec).toHaveBeenCalledWith("git", ["diff"], { cwd: dir });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("staged=true passes --staged", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitDiff({ cwd: dir, staged: true }, { exec });
      expect(exec).toHaveBeenCalledWith("git", ["diff", "--staged"], { cwd: dir });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("appends provided paths after --", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitDiff({ cwd: dir, paths: ["src/foo.ts", "src/bar.ts"] }, { exec });
      expect(exec).toHaveBeenCalledWith(
        "git",
        ["diff", "--", "src/foo.ts", "src/bar.ts"],
        { cwd: dir },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
