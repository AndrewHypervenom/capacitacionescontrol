import type { Doc } from "../../convex/_generated/dataModel";

export type Lock = Doc<"fileLocks">;

// Agrupa los locks por archivo.
export function groupByFile(locks: Lock[]): Map<string, Lock[]> {
  const map = new Map<string, Lock[]>();
  for (const l of locks) {
    if (!map.has(l.filePath)) map.set(l.filePath, []);
    map.get(l.filePath)!.push(l);
  }
  return map;
}

// Riesgo de conflicto = el mismo archivo lo trabajan varias personas,
// o aparece en más de una rama.
export function isConflict(rows: Lock[]): boolean {
  const people = new Set(rows.map((r) => r.userId)).size;
  const branches = new Set(rows.map((r) => r.branch)).size;
  return people > 1 || branches > 1;
}
