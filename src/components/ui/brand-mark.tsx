import type { ReactElement } from 'react';
interface BrandMarkProps { size?: number; className?: string; }
export function BrandMark({ size = 36, className = '' }: BrandMarkProps): ReactElement {
 return <img className={`brand-mark ${className}`} src={`${import.meta.env.BASE_URL}brand/pulso-mark.svg`} width={size} height={size} alt="" aria-hidden="true" />;
}
