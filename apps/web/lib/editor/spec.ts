/**
 * What the editor can edit, declared once.
 *
 * The acceptance for this batch is that every field in the canonical model is
 * editable. Hand-written forms cannot hold that promise: the model has about
 * seventy fields across twelve sections, and the first one added elsewhere
 * would quietly have no input. So the form is generated from this declaration,
 * and a test walks the zod schema to prove the declaration covers it. A field
 * added to the model without a node here fails the suite.
 */

export type InputKind =
  | "text"
  | "textarea"
  | "date"
  | "url"
  | "email"
  | "tel"
  | "boolean";

export type NodeSpec =
  | { readonly kind: "field"; readonly key: string; readonly input: InputKind }
  /** An array of plain strings: highlights, keywords, courses. */
  | { readonly kind: "stringList"; readonly key: string }
  | { readonly kind: "object"; readonly key: string; readonly children: readonly NodeSpec[] }
  | { readonly kind: "objectList"; readonly key: string; readonly children: readonly NodeSpec[] };

const text = (key: string): NodeSpec => ({ kind: "field", key, input: "text" });
const area = (key: string): NodeSpec => ({ kind: "field", key, input: "textarea" });
const date = (key: string): NodeSpec => ({ kind: "field", key, input: "date" });
const url = (key: string): NodeSpec => ({ kind: "field", key, input: "url" });
const list = (key: string): NodeSpec => ({ kind: "stringList", key });

const DATED = [date("startDate"), date("endDate")] as const;

export const RESUME_SPEC: readonly NodeSpec[] = [
  {
    kind: "object",
    key: "basics",
    children: [
      text("name"),
      text("label"),
      url("image"),
      { kind: "field", key: "email", input: "email" },
      { kind: "field", key: "phone", input: "tel" },
      url("url"),
      area("summary"),
      {
        kind: "object",
        key: "location",
        children: [
          text("address"),
          text("postalCode"),
          text("city"),
          text("countryCode"),
          text("region")
        ]
      },
      {
        kind: "objectList",
        key: "profiles",
        children: [text("network"), text("username"), url("url")]
      }
    ]
  },
  {
    kind: "objectList",
    key: "work",
    children: [text("name"), text("position"), url("url"), ...DATED, area("summary"), list("highlights")]
  },
  {
    kind: "objectList",
    key: "volunteer",
    children: [
      text("organization"),
      text("position"),
      url("url"),
      ...DATED,
      area("summary"),
      list("highlights")
    ]
  },
  {
    kind: "objectList",
    key: "education",
    children: [
      text("institution"),
      url("url"),
      text("area"),
      text("studyType"),
      ...DATED,
      text("score"),
      list("courses")
    ]
  },
  {
    kind: "objectList",
    key: "awards",
    children: [text("title"), date("date"), text("awarder"), area("summary")]
  },
  {
    kind: "objectList",
    key: "publications",
    children: [text("name"), text("publisher"), date("releaseDate"), url("url"), area("summary")]
  },
  {
    kind: "objectList",
    key: "skills",
    children: [text("name"), text("level"), list("keywords")]
  },
  {
    kind: "objectList",
    key: "languages",
    children: [text("language"), text("fluency")]
  },
  {
    kind: "objectList",
    key: "interests",
    children: [text("name"), list("keywords")]
  },
  {
    kind: "objectList",
    key: "references",
    children: [text("name"), area("reference")]
  },
  {
    kind: "objectList",
    key: "projects",
    children: [
      text("name"),
      { kind: "field", key: "isActive", input: "boolean" },
      area("description"),
      list("highlights"),
      list("keywords"),
      ...DATED,
      url("url"),
      list("roles"),
      text("entity"),
      text("type")
    ]
  },
  {
    kind: "object",
    key: "meta",
    children: [url("canonical"), text("version"), date("lastModified")]
  }
];

/** Every section id, in the order the form presents them. */
export const SECTION_IDS: readonly string[] = RESUME_SPEC.map((node) => node.key);

/** A blank item for an object list, which is an empty object: nothing invented. */
export function blankItem(): Record<string, unknown> {
  return {};
}
