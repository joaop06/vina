import { listClientsPage } from "@/src/services";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/foundation/auth/session";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { normalizePagination, PAGINATION } from "@/src/foundation/behaviors/catalog/pagination";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const { page, pageSize } = normalizePagination(
      {
        page: sp.get("page"),
        pageSize: sp.get("pageSize"),
      },
      { defaultPageSize: PAGINATION.ADMIN_DEFAULT_PAGE_SIZE },
    );
    const q = sp.get("q") ?? undefined;
    return jsonOk(await listClientsPage({ q, page, pageSize }));
  } catch (e) {
    return jsonError(e);
  }
}
