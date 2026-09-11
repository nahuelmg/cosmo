import { describe, it, expect } from "vitest";
import {
  formatArchiveYearLabel,
  formatArchiveYearLabels,
} from "./journal-club-helpers";

describe("formatArchiveYearLabel", () => {
  it("collapses to a single year when the season has only run one year", () => {
    expect(
      formatArchiveYearLabel("2026-2027", [{ date: "2026-09-07" }]),
    ).toBe("2026");
  });

  it("spans both years once the season crosses into the next one", () => {
    expect(
      formatArchiveYearLabel("2026-2027", [
        { date: "2027-04-10" },
        { date: "2026-09-07" },
      ]),
    ).toBe("2026-2027");
  });

  it("falls back to the season key for an empty group", () => {
    expect(formatArchiveYearLabel("2026-2027", [])).toBe("2026-2027");
  });
});

describe("formatArchiveYearLabels", () => {
  it("labels each season independently", () => {
    expect(
      formatArchiveYearLabels({
        "2026-2027": [{ date: "2026-09-07" }],
        "2024-2025": [{ date: "2025-04-10" }, { date: "2024-09-19" }],
      }),
    ).toEqual({ "2026-2027": "2026", "2024-2025": "2024-2025" });
  });

  it("keeps the season keys when two seasons collapse to the same year", () => {
    expect(
      formatArchiveYearLabels({
        "2026-2027": [{ date: "2026-10-02" }],
        "2025-2026": [{ date: "2026-03-14" }],
      }),
    ).toEqual({ "2026-2027": "2026-2027", "2025-2026": "2025-2026" });
  });
});
