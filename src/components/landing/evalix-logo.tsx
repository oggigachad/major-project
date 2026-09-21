import type { SVGProps } from "react";

export function EvalixLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* Stylized "E" with a pulse/wave node — representing AI screening */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="currentColor"
      />
      <path
        d="M9 10h12M9 16h8M9 22h12"
        stroke="#faf9f6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="16" r="2.5" fill="#c8f04a" />
    </svg>
  );
}
