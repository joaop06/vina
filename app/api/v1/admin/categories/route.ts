import { createCategory, listCategories } from "@/src/services";
import { categoryCreateSchema } from "@/src/schemas";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/foundation/auth/session";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { AppError } from "@/src/foundation/http/errors";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    // Admin must read live data — storefront cache can lag after creates.
    return jsonOk({ items: await listCategories() });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = categoryCreateSchema.parse(await req.json());
    return jsonOk(await createCategory(body), { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        new AppError("VALIDATION_ERROR", "Dados inválidos", 400, e.flatten()),
      );
    }
    return jsonError(e);
  }
}
