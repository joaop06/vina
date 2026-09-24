import { ingestAnalyticsBatch } from "@/src/services";
import { analyticsBatchSchema } from "@/src/schemas";
import { NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "@/src/foundation/http/errors";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { dateInSaoPaulo } from "@/src/foundation/platform/analytics-date";
import { rateLimit } from "@/src/foundation/platform/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!rateLimit(`analytics:${ip}`, 60, 60_000)) {
      throw new AppError("RATE_LIMITED", "Muitas requisições", 429);
    }

    const body = analyticsBatchSchema.parse(await req.json());
    const date = dateInSaoPaulo();
    await ingestAnalyticsBatch(body, date);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError(
        new AppError("VALIDATION_ERROR", "Dados inválidos", 400, e.flatten()),
      );
    }
    return jsonError(e);
  }
}
