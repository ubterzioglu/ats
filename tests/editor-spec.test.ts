import { describe, expect, it } from "vitest";
import { z } from "zod";

import { RESUME_SPEC, type NodeSpec } from "@/lib/editor/spec";
import { resumeSchema } from "@/lib/resume/schema";

/**
 * E.3's acceptance: every schema field is editable. Asserted by walking the zod
 * schema itself, so a field added to the model without a node in the spec fails
 * here rather than quietly having no input in the form.
 */

/** Unwraps optionals, arrays and unions down to the thing that carries a shape. */
function unwrap(schema: z.ZodType): z.ZodType {
  let current: z.ZodType = schema;

  for (let guard = 0; guard < 10; guard += 1) {
    const def = current.def as { type?: string; innerType?: z.ZodType; element?: z.ZodType };
    if (def.type === "optional" || def.type === "nullable" || def.type === "default") {
      if (!def.innerType) break;
      current = def.innerType;
      continue;
    }
    if (def.type === "array") {
      if (!def.element) break;
      current = def.element;
      continue;
    }
    break;
  }

  return current;
}

function isArraySchema(schema: z.ZodType): boolean {
  const def = schema.def as { type?: string; innerType?: z.ZodType };
  if (def.type === "array") return true;
  if (def.innerType) return isArraySchema(def.innerType);
  return false;
}

function shapeOf(schema: z.ZodType): Record<string, z.ZodType> | null {
  const inner = unwrap(schema);
  const def = inner.def as { type?: string; shape?: Record<string, z.ZodType> };
  if (def.type !== "object" && def.type !== "loose_object" && def.type !== "strict_object") {
    return def.shape ?? null;
  }
  return def.shape ?? null;
}

/** Every leaf path the schema declares, as "basics.location.city". */
function schemaPaths(schema: z.ZodType, prefix = ""): readonly string[] {
  const shape = shapeOf(schema);
  if (!shape) return prefix ? [prefix] : [];

  return Object.entries(shape).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const childShape = shapeOf(child);
    // An array of strings is a leaf: one input edits the whole list.
    if (!childShape) return [path];
    return schemaPaths(child, path);
  });
}

/** Every leaf path the editor renders an input for. */
function specPaths(nodes: readonly NodeSpec[], prefix = ""): readonly string[] {
  return nodes.flatMap((node) => {
    const path = prefix ? `${prefix}.${node.key}` : node.key;
    if (node.kind === "field" || node.kind === "stringList") return [path];
    return specPaths(node.children, path);
  });
}

describe("the editor spec against the schema", () => {
  const fromSchema = [...schemaPaths(resumeSchema)].sort();
  const fromSpec = [...specPaths(RESUME_SPEC)].sort();

  it("found a real schema to walk, so a broken walk cannot pass silently", () => {
    expect(fromSchema.length).toBeGreaterThan(50);
    expect(fromSchema).toContain("basics.name");
    expect(fromSchema).toContain("basics.location.city");
    expect(fromSchema).toContain("projects.highlights");
  });

  it("gives every field in the model an input", () => {
    const uneditable = fromSchema.filter((path) => !fromSpec.includes(path));
    expect(uneditable).toEqual([]);
  });

  it("declares no input for a field the model does not have", () => {
    const orphaned = fromSpec.filter((path) => !fromSchema.includes(path));
    expect(orphaned).toEqual([]);
  });
});

describe("the spec itself", () => {
  it("names every section the model has at the top level", () => {
    const shape = shapeOf(resumeSchema);
    expect(shape).not.toBeNull();
    expect(RESUME_SPEC.map((node) => node.key).sort()).toEqual(Object.keys(shape ?? {}).sort());
  });

  it("treats a date field as a date everywhere it appears", () => {
    const dates = specPaths(RESUME_SPEC).filter((path) =>
      /(^|\.)(startDate|endDate|date|releaseDate)$/.test(path)
    );
    expect(dates.length).toBeGreaterThan(8);

    const kinds = new Set<string>();
    const walk = (nodes: readonly NodeSpec[]) => {
      for (const node of nodes) {
        if (node.kind === "field" && /^(startDate|endDate|date|releaseDate)$/.test(node.key)) {
          kinds.add(node.input);
        }
        if (node.kind === "object" || node.kind === "objectList") walk(node.children);
      }
    };
    walk(RESUME_SPEC);

    expect([...kinds]).toEqual(["date"]);
  });
});
