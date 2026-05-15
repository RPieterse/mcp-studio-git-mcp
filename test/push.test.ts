import { describe, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitPush } from "../src/tools/push.js";

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "git-mcp-push-"));
}

describe("gitPush", () => {
  test("no args → `git push`", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitPush({ cwd: dir }, { exec });
      expect(exec).toHaveBeenCalledWith("git", ["push"], { cwd: dir });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("remote+branch passes positionals", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitPush(
        { cwd: dir, remote: "origin", branch: "fix/ui-issues" },
        { exec },
      );
      expect(exec).toHaveBeenCalledWith(
        "git",
        ["push", "origin", "fix/ui-issues"],
        { cwd: dir },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("set_upstream=true adds -u", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitPush(
        {
          cwd: dir,
          remote: "origin",
          branch: "feature/x",
          set_upstream: true,
        },
        { exec },
      );
      expect(exec).toHaveBeenCalledWith(
        "git",
        ["push", "-u", "origin", "feature/x"],
        { cwd: dir },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("never passes --force unless force=true", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await gitPush({ cwd: dir }, { exec });
      const [, args] = exec.mock.calls[0]!;
      expect(args).not.toContain("--force");
      expect(args).not.toContain("-f");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
