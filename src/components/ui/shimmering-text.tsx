import type { CSSProperties } from "react";

type ShimmeringTextProps = {
  duration?: number;
  text: string;
};

export function ShimmeringText({ duration = 4000, text }: ShimmeringTextProps) {
  const style: CSSProperties & { "--shimmer-duration": string } = {
    "--shimmer-duration": `${duration}ms`,
  };

  return (
    <span
      className="shimmering-text"
      style={style}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}
