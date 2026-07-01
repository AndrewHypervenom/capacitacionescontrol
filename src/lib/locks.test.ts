import { describe, it, expect } from "vitest";
import { groupByFile, isConflict, type Lock } from "./locks";

// Construye un lock de prueba con solo los campos que la lógica usa.
function lock(partial: Partial<Lock>): Lock {
  return {
    _id: (partial._id ?? Math.random().toString()) as Lock["_id"],
    _creationTime: partial._creationTime ?? Date.now(),
    filePath: partial.filePath ?? "src/App.tsx",
    branch: partial.branch ?? "main",
    userId: (partial.userId ?? "u1") as Lock["userId"],
    userName: partial.userName ?? "Ana",
    color: partial.color ?? "#000",
    note: partial.note,
  };
}

describe("groupByFile", () => {
  it("agrupa locks por ruta de archivo", () => {
    const map = groupByFile([
      lock({ filePath: "a.ts" }),
      lock({ filePath: "b.ts" }),
      lock({ filePath: "a.ts", userId: "u2" as Lock["userId"] }),
    ]);
    expect(map.get("a.ts")).toHaveLength(2);
    expect(map.get("b.ts")).toHaveLength(1);
    expect([...map.keys()]).toEqual(["a.ts", "b.ts"]);
  });

  it("devuelve un mapa vacío sin locks", () => {
    expect(groupByFile([]).size).toBe(0);
  });
});

describe("isConflict", () => {
  it("no hay conflicto con una sola persona en una rama", () => {
    expect(isConflict([lock({ userId: "u1" as Lock["userId"], branch: "main" })])).toBe(false);
  });

  it("hay conflicto con dos personas distintas en el mismo archivo", () => {
    expect(
      isConflict([
        lock({ userId: "u1" as Lock["userId"] }),
        lock({ userId: "u2" as Lock["userId"] }),
      ]),
    ).toBe(true);
  });

  it("hay conflicto si la misma persona lo toca en dos ramas", () => {
    expect(
      isConflict([
        lock({ userId: "u1" as Lock["userId"], branch: "main" }),
        lock({ userId: "u1" as Lock["userId"], branch: "isa" }),
      ]),
    ).toBe(true);
  });
});
