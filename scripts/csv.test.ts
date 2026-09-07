/**
 * Unit tests for the shared CSV parser (scripts/csv.ts).
 */

import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple grid", () => {
    expect(parseCsv("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF line endings and a missing final newline", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps commas and newlines inside quoted fields", () => {
    const csv = 'title,notes\r\n"A, B","line 1\nline 2"\r\n';
    expect(parseCsv(csv)).toEqual([
      ["title", "notes"],
      ["A, B", "line 1\nline 2"],
    ]);
  });

  it('unescapes doubled quotes ("")', () => {
    expect(parseCsv('x\n"she said ""hi"""')).toEqual([["x"], ['she said "hi"']]);
  });

  it("strips a leading BOM", () => {
    expect(parseCsv("﻿a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});
