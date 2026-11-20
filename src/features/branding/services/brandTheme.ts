import type { CSSProperties } from 'react';
export function brandTheme(color: string): CSSProperties {
 const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : '#17677b';
 const channels = [1,3,5].map(offset => parseInt(safe.slice(offset, offset + 2),16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
 const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
 return { '--tenant-primary': safe, '--tenant-on-primary': luminance > .179 ? '#142630' : '#ffffff' } as CSSProperties;
}
