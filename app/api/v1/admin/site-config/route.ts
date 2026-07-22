import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/lib/auth/session";
import { jsonError, jsonOk } from "@/src/lib/api/response";
import { AppError } from "@/src/lib/api/errors";
import { parseAdminMutationForm } from "@/src/lib/admin/parse-multipart";
import { updateSiteConfig } from "@/src/services/site-config.service";
import { getCachedSiteConfig } from "@/src/lib/cache/storefront-reads";
import { siteConfigUpdateSchema } from "@/src/schemas/site-config";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    return jsonOk(await getCachedSiteConfig());
  } catch (e) {
    return jsonError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { payload, pendingBinaries } = await parseAdminMutationForm(req);
    const body = siteConfigUpdateSchema.parse(payload);
    return jsonOk(await updateSiteConfig(body, pendingBinaries));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        new AppError("VALIDATION_ERROR", "Dados inválidos", 400, e.flatten()),
      );
    }
    return jsonError(e);
  }
}
