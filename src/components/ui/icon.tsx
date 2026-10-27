import type { ReactElement } from "react";
const paths = {
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  members:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87",
  plans: "M3 5h18v14H3z M3 10h18 M7 15h4",
  access: "M10 17l5-5-5-5 M3 12h12 M13 3h7v18h-7",
  renewals: "M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 14 6 M4 12a8 8 0 0 0 14 6",
  payments: "M12 2v20 M17 5H9a4 4 0 0 0 0 8h6a3 3 0 0 1 0 6H6",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  search: "M21 21l-5-5 M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  calendar: "M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16",
  check: "M5 12l4 4L19 6",
  close: "M6 6l12 12 M6 18L18 6",
  clock: "M12 8v5l3 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
  trend: "M3 17l6-6 4 4 8-10 M15 5h6v6",
  print: "M6 9V3h12v6 M6 18H3V9h18v9h-3 M6 14h12v7H6z",
  message:
    "M21 11a9 9 0 0 1-9 9c-2 0-3-.4-4-1l-5 2 2-5a9 9 0 1 1 16-5 M8 9c1 4 3 6 7 7",
  bolt: "M13 2L4 14h7l-1 8 10-13h-7z",
  help: "M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3 M12 17h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
  download: "M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5",
  chevron: "M9 5l7 7-7 7",
  tag: "M3 3h8l10 10-8 8L3 11z M7 7h.01",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  shield: "M12 3l9 4v5c0 5-9 10-9 10S3 17 3 12V7z M8 12l3 3 5-6",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  eyeOff: "M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.1-5.9 M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2 M1 1l22 22 M14.1 14.1a3 3 0 1 1-4.2-4.2",
  cash: "M2 6h20v12H2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M6 12h.01 M18 12h.01",
  phone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M11 18h2",
  bank: "M3 10l9-6 9 6 M5 10v8 M9 10v8 M15 10v8 M19 10v8 M3 21h18",
  building: "M4 21V5l8-3 8 3v16 M9 21v-5h6v5 M9 9h.01 M15 9h.01 M9 13h.01 M15 13h.01",
  network: "M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M5 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M12 9v3 M6.5 15L12 12l5.5 3",
  pin: "M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
};
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
