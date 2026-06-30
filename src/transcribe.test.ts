import { describe, expect, it } from "vitest";
import { buildDraftSystemPrompt, stripLeadingSubjectLabel } from "./draftPrompt";

describe("buildDraftSystemPrompt", () => {
  it("requires specific descriptive subjects instead of phrase-department templates", () => {
    const prompt = buildDraftSystemPrompt({ acronyms: "CalWORKs" });

    expect(prompt).toContain("specific and descriptive");
    expect(prompt).toContain("do not append a department as a generic suffix");
    expect(prompt).toContain("Time Sensitive Request");
    expect(prompt).not.toContain("[Action/Topic] — [Program or Department if relevant]");
    expect(prompt).toContain("Preserve these acronyms verbatim: CalWORKs");
  });
});

describe("stripLeadingSubjectLabel", () => {
  it("removes a leading Subject label without changing the subject text", () => {
    expect(stripLeadingSubjectLabel("Subject: Counseling appointment follow-up")).toBe(
      "Counseling appointment follow-up"
    );
    expect(stripLeadingSubjectLabel("  subject : Budget transfer deadline reminder")).toBe(
      "Budget transfer deadline reminder"
    );
  });
});
