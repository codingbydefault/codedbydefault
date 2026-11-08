const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function parseAllowlist(value: string | undefined | null): string[] {
  if (!value) return [];
  const emails = value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => EMAIL.test(entry));
  return [...new Set(emails)];
}

export function isAllowlisted(email: string | null | undefined, allowlist = parseAllowlist(process.env.ADMIN_EMAILS)) {
  if (!email || allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}
