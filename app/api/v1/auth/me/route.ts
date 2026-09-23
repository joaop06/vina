import { getSession } from "@/src/foundation/auth/session";
import { jsonError, jsonOk } from "@/src/foundation/http/response";
import { AppError } from "@/src/foundation/http/errors";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonError(new AppError("UNAUTHORIZED", "Não autenticado", 401));
  }
  return jsonOk({ username: session.sub });
}
