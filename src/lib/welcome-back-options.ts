/** Options for the /welcome-back page (returning-member win-back form). */

export const WELCOME_BACK_SOURCE = "welcome-back";

/**
 * Set as omnia_interest on welcome-back leads. The Klaviyo flow
 * "Auto-Reply: Welcome Back" filters on this exact value; it is not in the
 * site's contact dropdown, so the other auto-reply flows never match it.
 */
export const WELCOME_BACK_INTEREST = "Coming back to Omnia";

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
