import { caughtPersistError, type PersistResult } from "../persist";
import type { CollectInsert } from "./sites";

type QueryError = { message: string };

export type StoredPageView = CollectInsert;

export type PageViewWriter = {
  insertPageView(row: StoredPageView): Promise<QueryError | null>;
  findRecentDuplicate?(row: StoredPageView): Promise<boolean>;
};

export async function persistPageView(writer: PageViewWriter | null, row: StoredPageView | null): Promise<PersistResult> {
  if (!row || !writer) return { ok: true, skipped: true };
  try {
    if (writer.findRecentDuplicate && await writer.findRecentDuplicate(row)) {
      return { ok: true, skipped: true };
    }
    const error = await writer.insertPageView(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return caughtPersistError(error);
  }
}
