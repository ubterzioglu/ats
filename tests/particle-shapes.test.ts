import { describe, expect, it } from "vitest";

import { HUE_COUNT, generateParticles, type ShapeName } from "@/lib/particles/shapes";

const SHAPES: readonly ShapeName[] = ["brain", "match", "pipeline", "orbit", "report", "ambient"];

describe("particle shapes", () => {
  it.each(SHAPES)("%s returns the requested count, within a loose bound", (shape) => {
    const particles = generateParticles(shape, 600, 3);
    // Arc and ring layouts round their per-group share, so allow a small drift.
    expect(particles.length).toBeGreaterThan(540);
    expect(particles.length).toBeLessThanOrEqual(600);
  });

  it.each(SHAPES)("%s is deterministic for a seed and differs between seeds", (shape) => {
    const a = generateParticles(shape, 200, 5);
    const b = generateParticles(shape, 200, 5);
    const c = generateParticles(shape, 200, 6);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it.each(SHAPES)("%s keeps every field in its documented range", (shape) => {
    for (const particle of generateParticles(shape, 400, 2)) {
      expect(Number.isFinite(particle.x)).toBe(true);
      expect(Number.isFinite(particle.y)).toBe(true);
      expect(Math.abs(particle.x)).toBeLessThan(2);
      expect(Math.abs(particle.y)).toBeLessThan(2);
      expect(particle.size).toBeGreaterThanOrEqual(0);
      expect(particle.size).toBeLessThanOrEqual(1);
      expect(particle.alpha).toBeGreaterThan(0);
      expect(particle.alpha).toBeLessThanOrEqual(1);
      expect(Number.isInteger(particle.hue)).toBe(true);
      expect(particle.hue).toBeGreaterThanOrEqual(0);
      expect(particle.hue).toBeLessThan(HUE_COUNT);
    }
  });

  it("uses every hue in the brain, so the cloud is multicoloured", () => {
    const hues = new Set(generateParticles("brain", 1200, 1).map((particle) => particle.hue));
    expect(hues.size).toBe(HUE_COUNT);
  });

  it("shapes the brain: wider than tall, and denser inside than in the halo", () => {
    const particles = generateParticles("brain", 1500, 1);
    const xs = particles.map((particle) => particle.x);
    const ys = particles.map((particle) => particle.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(Math.max(...ys) - Math.min(...ys));

    const solid = particles.filter((particle) => particle.alpha >= 0.55).length;
    expect(solid).toBeGreaterThan(particles.length * 0.7);
  });

  it("returns nothing for a zero or negative count", () => {
    expect(generateParticles("brain", 0)).toEqual([]);
    expect(generateParticles("orbit", -5)).toEqual([]);
  });
});
