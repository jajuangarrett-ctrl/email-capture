import { describe, it, expect } from "vitest";
import { isDraftRefusal, stripLeadingSubjectLabel } from "./draft";

const REAL_DRAFT = `CalWORKs Hours Availability

Hi Michelle,

It was nice meeting you a few weeks ago at Gold Spun College. I apologize for the delay in responding to your email.

Regarding your interest in working with our CalWORKs department, we are currently assessing our needs for the fall.

I will reach out in a few weeks with specific time slots if additional hours become available.

Best regards,

Franklin`;

describe("stripLeadingSubjectLabel", () => {
  it("removes a leading 'Subject:' label case-insensitively", () => {
    expect(stripLeadingSubjectLabel("Subject: Hello")).toBe("Hello");
    expect(stripLeadingSubjectLabel("subject:Hello")).toBe("Hello");
    expect(stripLeadingSubjectLabel("  Subject:  Hi there")).toBe("Hi there");
  });

  it("leaves the text alone when no label is present", () => {
    expect(stripLeadingSubjectLabel("Hello, world")).toBe("Hello, world");
  });
});

describe("isDraftRefusal", () => {
  it("returns false for a real Franklin draft with the proper sign-off", () => {
    expect(isDraftRefusal(REAL_DRAFT)).toBe(false);
  });

  it("returns true for empty or whitespace-only text", () => {
    expect(isDraftRefusal("")).toBe(true);
    expect(isDraftRefusal("   \n\n  ")).toBe(true);
  });

  it("catches the exact GPT-4o clarification we saw in the wild", () => {
    expect(
      isDraftRefusal(
        "I'm here to assist with drafting professional emails based on specific input. Please provide the details for the email you need drafted, and I'll format it accordingly."
      )
    ).toBe(true);
  });

  it("catches common clarification openers", () => {
    expect(isDraftRefusal("I'd be happy to help. Please share more details about the recipient.")).toBe(true);
    expect(isDraftRefusal("Could you please clarify who the recipient should be?")).toBe(true);
    expect(isDraftRefusal("Sure! Let me know the recipient's name and the key points.")).toBe(true);
    expect(isDraftRefusal("Of course, please provide the recipient and the main message.")).toBe(true);
  });

  it("treats very short outputs without the sign-off as refusals", () => {
    expect(isDraftRefusal("Hello.")).toBe(true);
    expect(isDraftRefusal("OK, got it.")).toBe(true);
  });

  it("does not flag legitimate short drafts that include the sign-off", () => {
    const short = `Quick Question — Budget\n\nHi Sam,\n\nDo you have the FY25 numbers handy?\n\nBest regards,\n\nFranklin`;
    expect(isDraftRefusal(short)).toBe(false);
  });

  it("does not flag drafts where 'Best regards,' appears mid-text only if Franklin is missing", () => {
    // Has sign-off marker AND name — real draft
    const ok = "Subject line\n\nHello team,\n\nLong body content here.\n\nBest regards,\n\nFranklin";
    expect(isDraftRefusal(ok)).toBe(false);

    // Sign-off but no Franklin name — suspicious, treat as refusal
    const noName = "Hello there. Best regards, the team.";
    expect(isDraftRefusal(noName)).toBe(true);
  });
});
