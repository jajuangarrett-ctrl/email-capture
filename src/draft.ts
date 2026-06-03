/**
 * Pure (no Obsidian imports) helpers for evaluating GPT-4o draft output.
 * Lives in its own file so it can be unit-tested under vitest, which can't
 * resolve `obsidian` at test time.
 */

export function stripLeadingSubjectLabel(text: string): string {
  return text.replace(/^\s*subject\s*:\s*/i, "");
}

/**
 * Detects when GPT-4o returned a clarification/refusal/meta response instead of
 * an actual drafted email. Triggered when the input gist was empty, near-empty,
 * or so non-email-like that the model asked for more info instead of drafting.
 *
 * A real Franklin draft is guaranteed by the system prompt to end with
 * "Best regards," + "Franklin" on its own lines. If both markers are missing,
 * OR the body opens with a classic clarification phrase, we treat it as a
 * refusal so the caller can fall back to saving the raw gist instead of
 * persisting a useless "I'm here to assist..." message.
 */
export function isDraftRefusal(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return true;

  const hasSignoff = /best regards\s*,/i.test(t) && /\bfranklin\b/i.test(t);
  if (hasSignoff) return false;

  // Catch the most common GPT-4o clarification opener verbatim and a few
  // close cousins, anchored to the start of the response.
  const refusalOpeners = [
    /^i'?m here to (?:help|assist)/i,
    /^i'?(?:d|would) be (?:happy|glad) to/i,
    /^(?:please )?provide (?:the )?(?:details|more )/i,
    /^could you (?:please )?(?:provide|share|clarify)/i,
    /^to draft (?:the|this|an?) email/i,
    /^sure[,!.]? (?:i'?(?:d|ll)|let me|please)/i,
    /^of course[,!.]? (?:please|could|i'?(?:d|ll))/i,
  ];
  if (refusalOpeners.some((re) => re.test(t))) return true;

  // If the signoff is missing AND the body is very short, assume the model
  // either ran out or refused. Real drafts are 3 paragraphs / well over 60 chars.
  if (t.length < 60) return true;

  return false;
}
