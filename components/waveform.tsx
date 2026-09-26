"use client";
import { useEffect, useRef, RefObject } from "react";
export function Waveform({
  analyser,
  level,
  active,
}: {
  analyser: RefObject<AnalyserNode | null>;
  level: string;
  active: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    color = useRef([57, 115, 83]);
  useEffect(() => {
    let frame = 0;
    const data = new Uint8Array(128);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      const c = canvas.current,
        ctx = c?.getContext("2d");
      if (c && ctx) {
        const ratio = devicePixelRatio || 1,
          w = c.clientWidth,
          h = c.clientHeight;
        if (c.width !== w * ratio || c.height !== h * ratio) {
          c.width = w * ratio;
          c.height = h * ratio;
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, w, h);
        analyser.current?.getByteFrequencyData(data);
        const target =
          level === "high"
            ? [181, 71, 55]
            : level === "watch"
              ? [176, 126, 47]
              : [57, 115, 83];
        color.current = color.current.map((v, i) =>
          reduced ? target[i] : v + (target[i] - v) * 0.07,
        );
        ctx.fillStyle = `rgb(${color.current.map(Math.round).join(",")})`;
        const count = Math.floor(w / 9),
          gap = 4,
          bar = (w - gap * (count - 1)) / count;
        for (let i = 0; i < count; i++) {
          const a = analyser.current
            ? data[Math.floor((Math.abs(i - count / 2) / count) * 120)] / 255
            : 0;
          const bh = 4 + a * (h - 12);
          ctx.globalAlpha = 0.4 + a * 0.6;
          ctx.beginPath();
          ctx.roundRect(i * (bar + gap), (h - bh) / 2, bar, bh, 3);
          ctx.fill();
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [level, analyser]);
  return (
    <canvas
      ref={canvas}
      className="waveform"
      aria-label={
        active
          ? "Actual microphone audio amplitude"
          : "Microphone off. Waveform is flat."
      }
    />
  );
}
