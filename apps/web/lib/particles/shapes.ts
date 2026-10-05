/**
 * Particle layouts for the decorative field. Pure and seeded: the same seed
 * gives the same cloud on the server, in a test and after a resize, so the
 * picture never reshuffles while someone is reading.
 *
 * Coordinates live in a logical box of roughly [-1, 1] on both axes. The
 * renderer owns scale and motion; nothing here knows about a canvas.
 */

export type ShapeName = "brain" | "match" | "pipeline" | "orbit" | "report" | "ambient";

export interface Particle {
  readonly x: number;
  readonly y: number;
  /** 0..1, scaled to a pixel radius by the renderer. */
  readonly size: number;
  readonly angle: number;
  /** Radians per second. */
  readonly spin: number;
  /** Index into the renderer's palette. */
  readonly hue: number;
  /** 0..1 opacity of the stroke. */
  readonly alpha: number;
  readonly phase: number;
}

export const HUE_COUNT = 5;

type Random = () => number;

function mulberry32(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(random: Random): number {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

interface Point {
  readonly x: number;
  readonly y: number;
  /** Optional: a shape can pin the hue of a point it cares about. */
  readonly hue?: number;
  readonly alpha?: number;
}

/**
 * A side view of a brain, built from four overlapping ellipses (cerebrum,
 * temporal lobe, cerebellum, stem) with density modulated into ridges and one
 * central groove, so the cloud reads as folded tissue and not as an oval.
 */
function brainDensity(x: number, y: number): number {
  const cerebrum = Math.pow(Math.abs(x / 0.92), 2.4) + Math.pow(Math.abs((y + 0.1) / 0.58), 2.4);
  const temporal = ((x + 0.12) / 0.5) ** 2 + ((y - 0.32) / 0.25) ** 2;
  const cerebellum = ((x - 0.58) / 0.3) ** 2 + ((y - 0.44) / 0.19) ** 2;
  const stem = Math.abs(x - 0.22 - (y - 0.5) * 0.25) < 0.07 && y > 0.45 && y < 0.78;

  const inside = cerebrum < 1 || (temporal < 1 && y > 0.08) || cerebellum < 1 || stem;
  if (!inside) return 0;

  const ridges = 0.5 + 0.5 * Math.sin(9 * x + 4 * Math.sin(5 * y)) * Math.sin(7 * y + 3 * Math.sin(4 * x));
  // The groove runs from the top of the cerebrum down toward the temporal lobe.
  const grooveX = 0.06 - 0.2 * ((y + 0.6) / 0.6);
  const groove = smoothstep(0.0, 0.07, Math.abs(x - grooveX)) * 0.7 + 0.3;
  return (0.38 + 0.62 * ridges) * groove;
}

function sampleBrain(random: Random, count: number): Point[] {
  const points: Point[] = [];
  let guard = 0;
  while (points.length < count && guard < count * 60) {
    guard += 1;
    const x = (random() * 2 - 1) * 1.0;
    const y = (random() * 2 - 1) * 0.8;
    if (random() < brainDensity(x, y)) points.push({ x, y });
  }
  return points;
}

function sampleMatch(random: Random, count: number): Point[] {
  const points: Point[] = [];
  const side = Math.floor(count * 0.32);
  for (let i = 0; i < side; i += 1) {
    points.push({ x: -0.62 + gauss(random) * 0.2, y: gauss(random) * 0.3, hue: random() < 0.7 ? 0 : 3 });
    points.push({ x: 0.62 + gauss(random) * 0.2, y: gauss(random) * 0.3, hue: random() < 0.7 ? 1 : 2 });
  }
  // Bridges: arcs from a left point to a right point, drawn only where a term
  // on one side has a counterpart on the other.
  const arcs = 9;
  const perArc = Math.max(1, Math.floor((count - points.length) / arcs));
  for (let arc = 0; arc < arcs; arc += 1) {
    const startY = (arc / (arcs - 1) - 0.5) * 0.7;
    const endY = ((arcs - 1 - arc) / (arcs - 1) - 0.5) * 0.7 + (random() - 0.5) * 0.1;
    const lift = (random() - 0.5) * 0.5;
    const hue = arc % HUE_COUNT;
    for (let i = 0; i < perArc; i += 1) {
      const t = i / perArc;
      points.push({
        x: -0.62 + 1.24 * t + gauss(random) * 0.012,
        y: startY + (endY - startY) * t + Math.sin(Math.PI * t) * lift + gauss(random) * 0.012,
        hue,
        alpha: 0.55
      });
    }
  }
  return points;
}

function samplePipeline(random: Random, count: number): Point[] {
  const points: Point[] = [];
  const stages = 5;
  // Each stage keeps fewer particles than the one before: a funnel, not a bar.
  const weights = Array.from({ length: stages }, (_, stage) => stages - stage * 0.8);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  weights.forEach((weight, stage) => {
    const share = Math.round((weight / total) * count);
    const cx = -0.8 + (stage * 1.6) / (stages - 1);
    const spread = 0.42 * (weight / stages) + 0.06;
    for (let i = 0; i < share; i += 1) {
      points.push({ x: cx + gauss(random) * 0.07, y: gauss(random) * spread, hue: stage % HUE_COUNT });
    }
  });
  return points;
}

function sampleOrbit(random: Random, count: number): Point[] {
  const points: Point[] = [];
  const rings = [0.34, 0.62, 0.9];
  const core = Math.floor(count * 0.12);
  for (let i = 0; i < core; i += 1) {
    points.push({ x: gauss(random) * 0.08, y: gauss(random) * 0.08, hue: 1 });
  }
  const perRing = Math.floor((count - core) / rings.length);
  rings.forEach((radius, ring) => {
    for (let i = 0; i < perRing; i += 1) {
      const theta = random() * Math.PI * 2;
      const r = radius + gauss(random) * 0.018;
      points.push({
        x: Math.cos(theta) * r * 1.0,
        y: Math.sin(theta) * r * 0.78,
        hue: (ring * 2 + (theta > Math.PI ? 1 : 0)) % HUE_COUNT
      });
    }
  });
  return points;
}

function sampleReport(random: Random, count: number): Point[] {
  const points: Point[] = [];
  // A rising trace with the area under it thinning toward the baseline.
  const trace = (t: number): number => 0.55 - 1.0 * t + 0.14 * Math.sin(t * 11) * (1 - t * 0.4);
  for (let i = 0; i < count; i += 1) {
    const t = random();
    const x = -0.95 + 1.9 * t;
    const top = trace(t);
    if (random() < 0.4) {
      points.push({ x, y: top + gauss(random) * 0.012, hue: 1, alpha: 1 });
    } else {
      const depth = random() ** 2.2;
      points.push({ x, y: top + (0.78 - top) * depth, hue: (Math.floor(t * 5) + 2) % HUE_COUNT, alpha: 0.5 });
    }
  }
  return points;
}

function sampleAmbient(random: Random, count: number): Point[] {
  return Array.from({ length: count }, () => ({
    x: (random() * 2 - 1) * 1.4,
    y: (random() * 2 - 1) * 1.1,
    alpha: 0.18 + random() * 0.22
  }));
}

function sample(shape: ShapeName, random: Random, count: number): Point[] {
  switch (shape) {
    case "brain":
      return sampleBrain(random, count);
    case "match":
      return sampleMatch(random, count);
    case "pipeline":
      return samplePipeline(random, count);
    case "orbit":
      return sampleOrbit(random, count);
    case "report":
      return sampleReport(random, count);
    case "ambient":
      return sampleAmbient(random, count);
  }
}

/**
 * `count` particles in the given shape, plus a sparse scatter around it so the
 * cloud has an edge that fades instead of a cut-out silhouette.
 */
export function generateParticles(shape: ShapeName, count: number, seed = 1): readonly Particle[] {
  const random = mulberry32(seed * 7919 + shape.length);
  const safeCount = Math.max(0, Math.floor(count));
  const scatter = shape === "ambient" ? 0 : Math.floor(safeCount * 0.14);
  const body = sample(shape, random, safeCount - scatter);
  const halo = scatter > 0 ? sampleAmbient(random, scatter) : [];

  return [...body, ...halo].map((point) => {
    const field = 0.5 + 0.5 * Math.sin(point.x * 3.1 + point.y * 2.3);
    const hue = point.hue ?? Math.min(HUE_COUNT - 1, Math.floor((field * 0.7 + random() * 0.3) * HUE_COUNT));
    return {
      x: point.x,
      y: point.y,
      size: random(),
      angle: random() * Math.PI * 2,
      spin: (random() - 0.5) * 0.5,
      hue,
      alpha: point.alpha ?? 0.55 + random() * 0.45,
      phase: random() * Math.PI * 2
    };
  });
}
