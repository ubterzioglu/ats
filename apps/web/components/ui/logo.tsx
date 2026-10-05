import { useId } from "react";

interface LogoMarkProps {
  readonly size?: number;
}

/**
 * The angular mark. The violet-to-verdant fade is one of the two places the
 * system permits a gradient (the other is the particle field).
 */
export function LogoMark({ size = 22 }: LogoMarkProps) {
  const gradient = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8052ff" />
          <stop offset="1" stopColor="#15846e" />
        </linearGradient>
      </defs>
      <path d="M12 2 22 21H2L12 2Z" fill={`url(#${gradient})`} />
      <path d="M12 9.5 16.6 18H7.4L12 9.5Z" fill="#000000" />
    </svg>
  );
}
