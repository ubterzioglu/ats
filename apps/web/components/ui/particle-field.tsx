"use client";

import { useEffect, useRef } from "react";

import { generateParticles, type Particle, type ShapeName } from "@/lib/particles/shapes";

/**
 * Decorative only, so the whole thing is hidden from assistive technology.
 *
 * The palette is the one place the system leaves its seven tokens: the
 * constellation is specified as a full spectrum (violet, amber, teal, magenta,
 * blue), and magenta and blue exist nowhere else. Order matches HUE_COUNT in
 * lib/particles/shapes.ts.
 */
const PALETTE = ["#a3e635", "#ff7a1a", "#ffffff", "#d9f99d", "#ffb37a"] as const;

const ALPHA_STEPS = [0.35, 0.65, 1] as const;

/** Particle budget at full size; scaled down with the canvas so a phone draws a third. */
const BASE_COUNT: Readonly<Record<ShapeName, number>> = {
  brain: 1500,
  match: 760,
  pipeline: 700,
  orbit: 760,
  report: 760,
  ambient: 240
};

const MIN_SCALE = 0.3;
const FULL_WIDTH = 900;
const STROKE_WIDTH = 1.1;

interface ParticleFieldProps {
  readonly shape: ShapeName;
  readonly seed?: number;
  /** Sizes the field and must make it a positioned box (relative or absolute). */
  readonly className: string;
}

interface Bucket {
  readonly color: string;
  readonly alpha: number;
  readonly indices: number[];
}

function bucketize(particles: readonly Particle[]): readonly Bucket[] {
  const buckets: Bucket[] = [];
  PALETTE.forEach((color) => {
    ALPHA_STEPS.forEach((alpha) => buckets.push({ color, alpha, indices: [] }));
  });
  particles.forEach((particle, index) => {
    const level = particle.alpha < 0.5 ? 0 : particle.alpha < 0.8 ? 1 : 2;
    buckets[particle.hue * ALPHA_STEPS.length + level]?.indices.push(index);
  });
  return buckets.filter((bucket) => bucket.indices.length > 0);
}

export function ParticleField({ shape, seed = 1, className }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: readonly Particle[] = [];
    let buckets: readonly Bucket[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let inView = true;

    function draw(seconds: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const radius = Math.min(width / 2.1, height / 1.8);
      const glyph = Math.min(1.25, Math.max(0.7, radius / 300));
      const cx = width / 2;
      const cy = height / 2;
      context.lineWidth = STROKE_WIDTH;
      context.lineJoin = "round";

      for (const bucket of buckets) {
        context.strokeStyle = bucket.color;
        context.globalAlpha = bucket.alpha;
        context.beginPath();
        for (const index of bucket.indices) {
          const particle = particles[index];
          if (!particle) continue;
          const drift = (1.5 + particle.size * 3) * glyph;
          const px = cx + particle.x * radius + Math.sin(seconds * 0.5 + particle.phase) * drift;
          const py = cy + particle.y * radius + Math.cos(seconds * 0.4 + particle.phase * 1.3) * drift;
          const r = (2.4 + particle.size * 4.6) * glyph;
          const a = particle.angle + particle.spin * seconds;
          for (let corner = 0; corner < 3; corner += 1) {
            const theta = a + (corner * 2 * Math.PI) / 3;
            const x = px + Math.cos(theta) * r;
            const y = py + Math.sin(theta) * r;
            if (corner === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.closePath();
        }
        context.stroke();
      }
      context.globalAlpha = 1;
    }

    function resize() {
      if (!canvas || !context) return;
      const box = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(box.width));
      height = Math.max(1, Math.floor(box.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const scale = Math.min(1, Math.max(MIN_SCALE, width / FULL_WIDTH));
      particles = generateParticles(shape, Math.round(BASE_COUNT[shape] * scale), seed);
      buckets = bucketize(particles);
      if (reducedQuery.matches || !running()) draw(0);
    }

    function running(): boolean {
      return !reducedQuery.matches && inView && !document.hidden;
    }

    function tick(now: number) {
      frame = 0;
      if (!running()) return;
      draw(now / 1000);
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      if (running()) {
        if (frame === 0) frame = requestAnimationFrame(tick);
      } else {
        if (frame !== 0) cancelAnimationFrame(frame);
        frame = 0;
        draw(0);
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    reducedQuery.addEventListener("change", sync);

    resize();
    sync();

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedQuery.removeEventListener("change", sync);
    };
  }, [shape, seed]);

  return (
    <div aria-hidden="true" className={className}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
