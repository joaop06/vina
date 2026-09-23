import { clearSession } from "@/src/foundation/auth/session";
import { jsonOk } from "@/src/foundation/http/response";

export async function POST() {
  await clearSession();
  return jsonOk({ ok: true });
}
