import type { CSSProperties } from 'react';
export function brandTheme(color: string): CSSProperties {
 const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : '#17677b';
 const channels = [1,3,5].map(offset => parseInt(safe.slice(offset, offset + 2),16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
 const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
 return { '--tenant-primary': safe, '--tenant-on-primary': luminance > .179 ? '#142630' : '#ffffff' } as CSSProperties;
}
export function brandFavicon(name: string, color: string): string {
 const initial = (name.trim()[0] || 'G').replace(/[<>&"']/g, '');
 const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#17677b';
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="${safeColor}"/><rect x="8" y="7" width="24" height="26" rx="5" fill="white"/><text x="20" y="26" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#263745">${initial}</text></svg>`;
 return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
