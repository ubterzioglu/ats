interface SparkleProps {
  readonly className?: string;
}

/** The four-point star from the logo: white with a near-black outline. */
export function Sparkle({ className }: SparkleProps) {
  return (
    <svg viewBox="112 16 52 52" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M138 22 L143 36 L157 41 L143 46 L138 60 L133 46 L119 41 L133 36 Z"
        fill="#fff"
        stroke="#111"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The tick from the logo: an orange stroke over a thicker near-black one. */
export function Tick({ className }: SparkleProps) {
  return (
    <svg viewBox="34 38 124 100" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M54 100 L78 124 L140 56"
        fill="none"
        stroke="#111"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54 100 L78 124 L140 56"
        fill="none"
        stroke="#FF7A1A"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
