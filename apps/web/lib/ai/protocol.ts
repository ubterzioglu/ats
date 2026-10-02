/**
 * Message protocol between the page and the embedding worker. Kept in its own
 * module so both sides import one definition instead of mirroring shapes.
 */

export type WorkerInbound =
  | { readonly type: "load" }
  | { readonly type: "embed"; readonly id: number; readonly texts: readonly string[] };

export type WorkerOutbound =
  | {
      readonly type: "progress";
      readonly file: string;
      readonly progress: number;
      readonly loaded?: number;
      readonly total?: number;
    }
  | { readonly type: "ready" }
  | { readonly type: "embedded"; readonly id: number; readonly vectors: readonly (readonly number[])[] }
  | { readonly type: "error"; readonly message: string; readonly id?: number };
