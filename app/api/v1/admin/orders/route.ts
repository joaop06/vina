import { createOrder, listOrdersPage } from "@/src/services";
import { orderCanalSchema, orderCreateSchema, orderStatusSchema } from "@/src/schemas";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/foundation/auth/session";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { AppError } from "@/src/foundation/http/errors";
import { normalizePagination, PAGINATION } from "@/src/foundation/behaviors/catalog/pagination";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const statusRaw = searchParams.get("status");
    const canalRaw = searchParams.get("canal");
    const status = statusRaw
      ? orderStatusSchema.parse(statusRaw)
      : undefined;
    const canal = canalRaw ? orderCanalSchema.parse(canalRaw) : undefined;
    const q = searchParams.get("q") ?? undefined;
    const { page, pageSize } = normalizePagination(
      {
        page: searchParams.get("page"),
        pageSize: searchParams.get("pageSize"),
      },
      { defaultPageSize: PAGINATION.ADMIN_DEFAULT_PAGE_SIZE },
    );
    return jsonOk(
      await listOrdersPage({ status, canal, q, page, pageSize }),
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        new AppError("VALIDATION_ERROR", "Filtros inválidos", 400, e.flatten()),
      );
    }
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = orderCreateSchema.parse(await req.json());
    return jsonOk(await createOrder(body), { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        new AppError("VALIDATION_ERROR", "Dados inválidos", 400, e.flatten()),
      );
    }
    return jsonError(e);
  }
}
