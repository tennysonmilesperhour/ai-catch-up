"use client";

import { useEffect, useState } from "react";

type UtilityBarProps = {
  left?: string[];
  rightStatic?: string[];
};

function fmtUtc(d: Date) {
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss} UTC`;
}

export function UtilityBar({
  left = ["SYSTEM ONLINE", "Build 26.04 · stable"],
  rightStatic = ["v1.0.0"],
}: UtilityBarProps) {
  const [now, setNow] = useState<string>(fmtUtc(new Date()));

  useEffect(() => {
    const id = setInterval(() => setNow(fmtUtc(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="utility-bar" role="status" aria-live="off">
      <div className="group">
        <span className="dot" aria-hidden />
        {left.map((part, i) => (
          <span key={i} className="group">
            <span>{part}</span>
            {i < left.length - 1 && <span className="sep">·</span>}
          </span>
        ))}
      </div>
      <div className="group">
        {rightStatic.map((part, i) => (
          <span key={i} className="group">
            <span>{part}</span>
            <span className="sep">·</span>
          </span>
        ))}
        <span className="num-tab">{now}</span>
      </div>
    </div>
  );
}
