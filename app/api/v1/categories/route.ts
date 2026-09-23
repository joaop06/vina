import { getCachedActiveCategories } from "@/src/foundation/cache/storefront-reads";
import { jsonError, jsonOk } from "@/src/foundation/http/response";

export async function GET() {
  try {
    return jsonOk({ items: await getCachedActiveCategories() });
  } catch (e) {
    return jsonError(e);
  }
}
