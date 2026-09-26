"use client";

import type { CSSProperties, PointerEvent } from "react";

export function GlassPhrase({ children }: { children: string }) {
  const style = {
    "--shine-x": "50%",
    "--shine-y": "50%",
    "--shine-opacity": "0",
  } as CSSProperties;

  function followPointer(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 100;
    const y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 100;
    event.currentTarget.style.setProperty("--shine-x", `${Math.max(0, Math.min(100, x))}%`);
    event.currentTarget.style.setProperty("--shine-y", `${Math.max(0, Math.min(100, y))}%`);
    event.currentTarget.style.setProperty("--shine-opacity", "1");
  }

  function hideShine(event: PointerEvent<HTMLSpanElement>) {
    event.currentTarget.style.setProperty("--shine-opacity", "0");
  }

  return (
    <span
      className="glass-phrase"
      style={style}
      onPointerEnter={followPointer}
      onPointerMove={followPointer}
      onPointerLeave={hideShine}
    >
      <span className="glass-phrase-base">{children}</span>
      <span className="glass-phrase-shine" aria-hidden="true">{children}</span>
    </span>
  );
}
