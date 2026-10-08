import type { FeatureSlug } from "./index";

export interface FeaturePoint {
  readonly label?: string;
  readonly text: string;
}

export interface FeatureEntry {
  readonly title: string;
  readonly summary: string;
  readonly intro?: string;
  readonly points: readonly FeaturePoint[];
  readonly outro?: string;
}

export type FeatureContent = Readonly<Record<FeatureSlug, FeatureEntry>>;
