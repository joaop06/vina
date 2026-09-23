import { deleteCategory, getCategory, updateCategory } from "@/src/services";
import { categoryUpdateSchema } from "@/src/schemas";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/foundation/auth/session";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { AppError } from "@/src/foundation/http/errors";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const item = await getCategory(id);
    if (!item) throw new AppError("NOT_FOUND", "Categoria não encontrada", 404);
    return jsonOk(item);
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = categoryUpdateSchema.parse(await req.json());
    return jsonOk(await updateCategory(id, body));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        new AppError("VALIDATION_ERROR", "Dados inválidos", 400, e.flatten()),
      );
    }
    return jsonError(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await deleteCategory(id);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
