"use client";
import { useEffect } from "react";

const STAR_COLORS = ["#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#fff7cc"];

export default function CursorEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = document.createElement("div");
    layer.className = "fx-layer";
    document.body.appendChild(layer);

    let last = 0;
    function onMove(e) {
      const now = performance.now();
      if (now - last < 26) return; // throttle spawn rate
      last = now;
      spawnStar(e.clientX, e.clientY);
      if (Math.random() < 0.35) spawnStar(e.clientX, e.clientY);
    }

    function spawnStar(x, y) {
      if (layer.childElementCount > 90) return;
      const s = document.createElement("span");
      s.className = "fx-star";
      s.textContent = Math.random() < 0.3 ? "✧" : "✦";
      s.style.left = `${x + (Math.random() * 20 - 10)}px`;
      s.style.top = `${y + (Math.random() * 20 - 10)}px`;
      s.style.fontSize = `${6 + Math.random() * 10}px`;
      s.style.color = STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0];
      s.style.setProperty("--dx", `${Math.random() * 40 - 20}px`);
      s.style.setProperty("--dy", `${16 + Math.random() * 30}px`);
      s.style.setProperty("--rot", `${Math.random() * 240 - 120}deg`);
      layer.appendChild(s);
      setTimeout(() => s.remove(), 850);
    }

    function onClick(e) {
      const btn = e.target.closest?.("button, [role='button'], a.btn-primary, a.btn-ghost, a.btn-danger");
      if (!btn) return;
      // smooth jelly wobble on the button itself
      btn.classList.remove("fx-wobble");
      void btn.offsetWidth; // restart the animation if mid-flight
      btn.classList.add("fx-wobble");
      btn.addEventListener("animationend", () => btn.classList.remove("fx-wobble"), { once: true });
      splash(e.clientX, e.clientY);
    }

    function splash(x, y) {
      const ring = document.createElement("span");
      ring.className = "fx-ring";
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
      layer.appendChild(ring);
      setTimeout(() => ring.remove(), 700);

      for (let i = 0; i < 8; i++) {
        const d = document.createElement("span");
        d.className = "fx-drop";
        const size = 3 + Math.random() * 5;
        const ang = Math.random() * Math.PI * 2;
        const dist = 14 + Math.random() * 28;
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        d.style.width = `${size}px`;
        d.style.height = `${size * 1.15}px`;
        d.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
        d.style.setProperty("--dy", `${Math.sin(ang) * dist * 0.6 - 14}px`);
        layer.appendChild(d);
        setTimeout(() => d.remove(), 750);
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick, true);
      layer.remove();
    };
  }, []);

  return null;
}
