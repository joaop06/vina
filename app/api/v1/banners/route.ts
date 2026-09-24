import type { Banner } from "@/src/schemas";
import { NextRequest } from "next/server";
import { getCachedActiveBanners } from "@/src/foundation/cache/storefront-reads";
import { jsonError, jsonOk } from "@/src/foundation/http/response";

export async function GET(req: NextRequest) {
  try {
    const posicao = req.nextUrl.searchParams.get("posicao") as
      | Banner["posicao"]
      | null;
    return jsonOk({
      items: await getCachedActiveBanners(posicao ?? undefined),
    });
  } catch (e) {
    return jsonError(e);
  }
}
