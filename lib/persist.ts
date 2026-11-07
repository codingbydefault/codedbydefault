export type PersistResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

export function caughtPersistError(error: unknown): PersistResult {
  return { ok: false, error: error instanceof Error ? error.message : "opslaan mislukt" };
}
