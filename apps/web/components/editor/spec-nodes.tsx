"use client";

import { useTranslations } from "next-intl";

import {
  appendItem,
  moveItem,
  readList,
  removeItem,
  type Path
} from "@/lib/editor/draft";
import { blankItem, type NodeSpec } from "@/lib/editor/spec";
import type { Resume } from "@/types/resume";

import { FieldInput, StringListInput } from "./field-input";

interface NodesProps {
  readonly resume: Resume;
  readonly nodes: readonly NodeSpec[];
  readonly path: Path;
  /** Catalog prefix for labels, e.g. "fields.work". */
  readonly labelScope: string;
  readonly onChange: (next: Resume) => void;
}

/**
 * Renders a list of spec nodes. Recursive, because the model is: `basics` holds
 * a `location` object and a `profiles` list, and a section is an array of items
 * that are themselves lists of nodes.
 */
export function SpecNodes({ resume, nodes, path, labelScope, onChange }: NodesProps) {
  const t = useTranslations("editor");

  return (
    <div className="space-y-4">
      {nodes.map((node) => {
        const childPath = [...path, node.key];
        // A container owns a namespace, so its own name cannot sit at that key
        // - next-intl would resolve it to the object. It sits at `_label`.
        const isContainer = node.kind === "object" || node.kind === "objectList";
        const label = t(`${labelScope}.${node.key}${isContainer ? "._label" : ""}`);

        if (node.kind === "field") {
          return (
            <FieldInput
              key={node.key}
              resume={resume}
              path={childPath}
              input={node.input}
              label={label}
              onChange={onChange}
            />
          );
        }

        if (node.kind === "stringList") {
          return (
            <StringListInput
              key={node.key}
              resume={resume}
              path={childPath}
              label={label}
              onChange={onChange}
            />
          );
        }

        if (node.kind === "object") {
          return (
            <fieldset key={node.key} className="rounded-control border border-line p-4">
              <legend className="condensed px-2 text-micro font-medium text-muted">{label}</legend>
              <SpecNodes
                resume={resume}
                nodes={node.children}
                path={childPath}
                labelScope={`${labelScope}.${node.key}`}
                onChange={onChange}
              />
            </fieldset>
          );
        }

        const items = readList(resume, childPath);

        return (
          <fieldset key={node.key} className="rounded-control border border-line p-4">
            <legend className="condensed px-2 text-micro font-medium text-muted">{label}</legend>

            <ol className="space-y-4">
              {items.map((_, index) => (
                <li key={`${node.key}-${index}`} className="rounded-control bg-bench-sunk p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="font-mono text-micro tabular-nums text-muted">{index + 1}</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-quiet"
                        disabled={index === 0}
                        onClick={() => onChange(moveItem(resume, childPath, index, index - 1))}
                      >
                        {t("moveUp")}
                      </button>
                      <button
                        type="button"
                        className="btn-quiet"
                        disabled={index === items.length - 1}
                        onClick={() => onChange(moveItem(resume, childPath, index, index + 1))}
                      >
                        {t("moveDown")}
                      </button>
                      <button
                        type="button"
                        className="btn-quiet"
                        onClick={() => onChange(removeItem(resume, childPath, index))}
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>

                  <SpecNodes
                    resume={resume}
                    nodes={node.children}
                    path={[...childPath, index]}
                    labelScope={`${labelScope}.${node.key}`}
                    onChange={onChange}
                  />
                </li>
              ))}
            </ol>

            <button
              type="button"
              className="btn-quiet mt-4"
              onClick={() => onChange(appendItem(resume, childPath, blankItem()))}
            >
              {t("addTo", { section: label })}
            </button>
          </fieldset>
        );
      })}
    </div>
  );
}
