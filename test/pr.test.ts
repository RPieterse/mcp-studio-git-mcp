import { describe, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prCreate, prComment } from "../src/tools/pr.js";

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "git-mcp-pr-"));
}

describe("prCreate", () => {
  test("runs `gh pr create --title --body`", async () => {
    const dir = tmpDir();
    try {
      const exec = vi.fn().mockResolvedValue({
        stdout: "https://github.com/x/y/pull/42",
        stderr: "",
        code: 0,
      });
      const result = await prCreate(
        { cwd: dir, title: "Fix UI", body: "Closes issue." },
        { exec },
      );
      expect(exec).toHaveBeenCalledWith(
        "gh",
        ["pr", "create", "--title", "Fix UI", "--body", "Closes issue."],
        { cwd: dir },
      );
      expect(result.text).toContain("/pull/42");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rejects empty title", async () => {
    const dir = tmpDir();
    try {
      const exec = vi.fn();
      const result = await prCreate(
        { cwd: dir, title: "", body: "x" },
        { exec },
      );
      expect(result.isError).toBe(true);
      expect(exec).not.toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("prComment", () => {
  test("runs `gh pr comment <n> --body`", async () => {
    const dir = tmpDir();
    try {
      const exec = vi
        .fn()
        .mockResolvedValue({ stdout: "", stderr: "", code: 0 });
      await prComment(
        { cwd: dir, number: 42, body: "LGTM" },
        { exec },
      );
      expect(exec).toHaveBeenCalledWith(
        "gh",
        ["pr", "comment", "42", "--body", "LGTM"],
        { cwd: dir },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
