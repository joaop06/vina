import { getDashboardStats, periodForPreset, type DashboardPeriodPreset } from "@/src/services";
import { requireAdmin } from "@/src/foundation/auth/session";
import { AppError } from "@/src/foundation/http/errors";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { parseDateOnly } from "@/src/foundation/platform/analytics-date";
import { NextRequest } from "next/server";

const PRESETS = new Set<DashboardPeriodPreset>([
  "today",
  "7d",
  "30d",
  "month",
  "custom",
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const presetRaw = sp.get("preset") ?? "7d";
    const preset = (
      PRESETS.has(presetRaw as DashboardPeriodPreset) ? presetRaw : "7d"
    ) as DashboardPeriodPreset;

    let from = sp.get("from") ?? undefined;
    let to = sp.get("to") ?? undefined;

    if (preset !== "custom") {
      const resolved = periodForPreset(preset);
      from = resolved.from;
      to = resolved.to;
    } else {
      if (!from || !to || !parseDateOnly(from) || !parseDateOnly(to) || from > to) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Informe as datas De e Até válidas (AAAA-MM-DD)",
          400,
        );
      }
    }

    const stats = await getDashboardStats(from, to);
    return jsonOk({ ...stats, preset });
  } catch (e) {
    return jsonError(e);
  }
}
