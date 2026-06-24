"use client";
import { Star } from "lucide-react";

export default function Stars({ value = 0, onChange }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={15}
          onClick={onChange ? () => onChange(i) : undefined}
          className={`${i <= value ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"} ${onChange ? "cursor-pointer" : ""}`}
        />
      ))}
    </span>
  );
}
