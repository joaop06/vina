import {
  jsonDocumentsEqual,
  serializeDataJson,
} from "@/src/foundation/data/migrations/json-equal";
import type { FileChange } from "@/src/foundation/data/types";

export { jsonDocumentsEqual, serializeDataJson };

export function fileChangeIfMigrated(
  relativePath: string,
  raw: unknown,
  migrated: unknown,
): FileChange | null {
  if (jsonDocumentsEqual(raw, migrated)) return null;
  return {
    path: relativePath,
    content: serializeDataJson(migrated),
    encoding: "utf-8",
  };
}
