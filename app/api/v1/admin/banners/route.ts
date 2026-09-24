import { createBanner } from "@/src/services";
import { bannerCreateSchema } from "@/src/schemas";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/foundation/auth/session";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { AppError } from "@/src/foundation/http/errors";
import { parseAdminMutationForm } from "@/src/foundation/admin/parse-multipart";
import { getCachedAllBanners } from "@/src/foundation/cache/storefront-reads";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    return jsonOk({ items: await getCachedAllBanners() });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { payload, pendingBinaries } = await parseAdminMutationForm(req);
    const body = bannerCreateSchema.parse(payload);
    return jsonOk(await createBanner(body, pendingBinaries), { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        new AppError("VALIDATION_ERROR", "Dados inválidos", 400, e.flatten()),
      );
    }
    return jsonError(e);
  }
}
