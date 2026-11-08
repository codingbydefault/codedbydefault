import { caughtPersistError, type PersistResult } from "../persist";
import type { GuideInsert } from "./guide";
import type { QuickscanInsert } from "./quickscan";

type QueryError = { message: string };

export type GuideWriter = {
  insertGuide(row: GuideInsert): Promise<QueryError | null>;
};

export type QuickscanWriter = {
  insertQuickscan(row: QuickscanInsert): Promise<QueryError | null>;
};

export async function persistGuide(writer: GuideWriter | null, row: GuideInsert): Promise<PersistResult> {
  if (!writer) return { ok: true, skipped: true };
  try {
    const error = await writer.insertGuide(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return caughtPersistError(error);
  }
}

export async function persistQuickscan(writer: QuickscanWriter | null, row: QuickscanInsert): Promise<PersistResult> {
  if (!writer) return { ok: true, skipped: true };
  try {
    const error = await writer.insertQuickscan(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return caughtPersistError(error);
  }
}
