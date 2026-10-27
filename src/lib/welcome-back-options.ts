/** Options for the /welcome-back page (returning-member win-back form). */

export const WELCOME_BACK_SOURCE = "welcome-back";

/** Routed through the Membership auto-reply flow (SMS + email + Slack). */
export const WELCOME_BACK_INTEREST = "Are you interested in Membership?";

export const LAST_TRAINED_OPTIONS = [
  "Less than 6 months ago",
  "6–12 months ago",
  "1–3 years ago",
  "More than 3 years ago",
  "Never trained at Omnia",
] as const;

export type LastTrained = (typeof LAST_TRAINED_OPTIONS)[number];

export function isValidLastTrained(v: string): v is LastTrained {
  return (LAST_TRAINED_OPTIONS as readonly string[]).includes(v);
}
