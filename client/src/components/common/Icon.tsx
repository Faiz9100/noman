import { SVGAttributes } from "react";

export type IconName =
  | "grid"
  | "bolt"
  | "shield"
  | "user"
  | "history"
  | "settings"
  | "tv"
  | "menu"
  | "close"
  | "search"
  | "bell"
  | "chevron-down"
  | "chevron-right"
  | "trophy"
  | "wallet"
  | "users"
  | "trending-up"
  | "trending-down"
  | "clock"
  | "check"
  | "x"
  | "logout"
  | "lock"
  | "mail"
  | "eye"
  | "eye-off"
  | "gavel"
  | "sparkles"
  | "gauge"
  | "filter"
  | "external-link"
  | "arrow-right"
  | "star"
  | "expand";

interface IconProps extends SVGAttributes<SVGSVGElement> {
  name: IconName;
  className?: string;
}

const paths: Record<IconName, JSX.Element> = {
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />,
  shield: <path d="M12 3 5 6v5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z" strokeLinejoin="round" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1-4 4.5-6 7-6s6 2 7 6" strokeLinecap="round" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
      <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path
        d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.36 5.64l-1.55 1.55M7.19 16.81l-1.55 1.55M18.36 18.36l-1.55-1.55M7.19 7.19 5.64 5.64"
        strokeLinecap="round"
      />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  "chevron-right": <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" strokeLinejoin="round" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" strokeLinecap="round" />
      <path d="M12 13v3M9 20h6M10 20v-2.5M14 20v-2.5" strokeLinecap="round" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c.8-3.5 3.6-5.5 6.5-5.5s5.7 2 6.5 5.5" strokeLinecap="round" />
      <path d="M16 4.2a3 3 0 0 1 0 5.8" strokeLinecap="round" />
      <path d="M18.5 14.8c2 .6 3.4 2.3 4 5.2" strokeLinecap="round" />
    </>
  ),
  "trending-up": (
    <>
      <path d="m3 17 6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "trending-down": (
    <>
      <path d="m3 7 6 6 4-4 8 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 17h6v-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  check: <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" strokeLinecap="round" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a13.4 13.4 0 0 1-3.1 3.9M6.7 6.7C4 8.5 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" />
    </>
  ),
  gavel: (
    <>
      <path d="m14.5 4.5 5 5L16 13l-5-5 3.5-3.5Z" strokeLinejoin="round" />
      <path d="m9 9-6.5 6.5M3 21l3-3M13 15l6 6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
      <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" strokeLinecap="round" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 15a8 8 0 1 1 16 0" strokeLinecap="round" />
      <path d="M12 15 15.5 9" strokeLinecap="round" />
    </>
  ),
  filter: <path d="M4 5h16l-6 8v6l-4 2v-8L4 5Z" strokeLinejoin="round" />,
  "external-link": (
    <>
      <path d="M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4 10 14" strokeLinecap="round" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" strokeLinecap="round" />
    </>
  ),
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  star: <path d="m12 2 3.1 6.6 7.2.9-5.3 5 1.4 7.2-6.4-3.5-6.4 3.5 1.4-7.2-5.3-5 7.2-.9L12 2Z" strokeLinejoin="round" />,
  expand: (
    <>
      <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

export function Icon({ name, className = "h-5 w-5", ...rest }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
