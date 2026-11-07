// Houd gelijk aan de generated column is_test in de migratie:
// lower(email) like '%@resend.dev' or position('test' in lower(name)) > 0

export function isTestRequest(input: { name: string; email: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().toLowerCase();
  return email.endsWith("@resend.dev") || name.includes("test");
}
