export type PasswordStrength = "weak" | "medium" | "strong";

export const EMPTY_FIELD_MESSAGE = "This field needs to be filled";
export const INVALID_EMAIL_MESSAGE = "Please write your email correctly";
export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Your password must contain numbers and characters like (/, *, @), with no spaces";

const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

export function isAllowedSignupEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  const domain = trimmed.split("@")[1];
  return ALLOWED_EMAIL_DOMAINS.has(domain);
}

export function meetsPasswordCharacterRules(password: string) {
  if (/\s/.test(password)) return false;
  return /\d/.test(password) && /[/*@]/.test(password);
}

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}
