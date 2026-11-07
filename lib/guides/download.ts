import path from "node:path";
import { randomBytes } from "node:crypto";
import { caughtPersistError, type PersistResult } from "../persist";
import { GUIDE_FILENAME, GUIDE_PUBLIC_PATH, GUIDE_SLUG } from "./constants";

export function guideFilePath() {
  return path.join(process.cwd(), "private", "guides", GUIDE_FILENAME);
}

export function createDownloadToken() {
  return randomBytes(32).toString("hex");
}

export function readDownloadToken(value: string | null | undefined) {
  if (!value || !/^[0-9a-f]{64}$/.test(value)) return null;
  return value;
}

export function buildGuideDownloadUrl(origin: string, token: string) {
  const url = new URL(GUIDE_PUBLIC_PATH, origin);
  url.searchParams.set("t", token);
  return url.toString();
}

export type DownloadInsert = {
  guide: typeof GUIDE_SLUG;
  guide_request_id: number | null;
  source: "token" | "legacy";
};

export function buildDownloadInsert(matchedRequestId: number | null): DownloadInsert {
  return {
    guide: GUIDE_SLUG,
    guide_request_id: matchedRequestId,
    source: matchedRequestId === null ? "legacy" : "token",
  };
}

type QueryError = { message: string };

export type DownloadRecorder = {
  findRequestIdByToken(token: string): Promise<number | null>;
  insertDownload(row: DownloadInsert): Promise<QueryError | null>;
};

export async function persistDownload(
  recorder: DownloadRecorder | null,
  token: string | null,
): Promise<PersistResult> {
  if (!recorder) return { ok: true, skipped: true };
  try {
    const validToken = readDownloadToken(token);
    const matched = validToken ? await recorder.findRequestIdByToken(validToken) : null;
    const error = await recorder.insertDownload(buildDownloadInsert(matched));
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return caughtPersistError(error);
  }
}
