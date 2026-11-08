import "server-only";
import type { PageViewWriter } from "../analytics/persist";
import type { DownloadRecorder } from "../guides/download";
import type { GuideWriter } from "../leads/persist";
import type { QuickscanWriter } from "../leads/persist";
import { createAdminClient } from "./admin";

function requestId(value: unknown) {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

export function guideWriter(): GuideWriter | null {
  const client = createAdminClient();
  if (!client) return null;
  return {
    async insertGuide(row) {
      const { error } = await client.from("guide_requests").insert(row);
      return error ? { message: error.message } : null;
    },
  };
}

export function quickscanWriter(): QuickscanWriter | null {
  const client = createAdminClient();
  if (!client) return null;
  return {
    async insertQuickscan(row) {
      const { error } = await client.from("quickscan_requests").insert(row);
      return error ? { message: error.message } : null;
    },
  };
}

export function downloadRecorder(): DownloadRecorder | null {
  const client = createAdminClient();
  if (!client) return null;
  return {
    async findRequestIdByToken(token) {
      const { data, error } = await client
        .from("guide_requests")
        .select("id")
        .eq("download_token", token)
        .maybeSingle();
      if (error || !data) return null;
      return requestId(data.id);
    },
    async insertDownload(row) {
      const { error } = await client.from("guide_downloads").insert(row);
      return error ? { message: error.message } : null;
    },
  };
}

export function pageViewWriter(): PageViewWriter | null {
  const client = createAdminClient();
  if (!client) return null;
  return {
    async insertPageView(row) {
      const { error } = await client.from("page_views").insert(row);
      return error ? { message: error.message } : null;
    },
  };
}
