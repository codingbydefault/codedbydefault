import { caughtPersistError, type PersistResult } from "../persist";
import type { PageViewInsert } from "./privacy";

type QueryError = { message: string };

export type PageViewWriter = {
  insertPageView(row: PageViewInsert): Promise<QueryError | null>;
};

export async function persistPageView(writer: PageViewWriter | null, row: PageViewInsert | null): Promise<PersistResult> {
  if (!row || !writer) return { ok: true, skipped: true };
  try {
    const error = await writer.insertPageView(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return caughtPersistError(error);
  }
}
