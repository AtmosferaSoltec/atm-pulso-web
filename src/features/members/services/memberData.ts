import type { Member, MemberStatus } from '@/features/members/types/member.types';
import { assignReceiptNumbers } from '@/features/members/services/receipt';
export const DEMO_DATE = '2026-10-26';
const memberFixtures = [
 { id:'1', name:'Valentina Rodríguez', dni:'74829163', phone:'51999000001', plan:'Trimestral', start:'2026-07-29', end:'2026-10-29', paid:270, method:'Yape/Plin' },
 { id:'2', name:'Diego Mendoza', dni:'72941856', phone:'51999000002', plan:'Mensual', start:'2026-10-01', end:'2026-11-01', paid:100, method:'Efectivo' },
 { id:'3', name:'Camila Torres', dni:'76381249', phone:'51999000003', plan:'Anual', start:'2026-03-10', end:'2027-03-10', paid:900, method:'Tarjeta' },
 { id:'4', name:'Sebastián Flores', dni:'71452983', phone:'51999000004', plan:'Mensual', start:'2026-09-28', end:'2026-10-28', paid:100, method:'Yape/Plin' },
 { id:'5', name:'Luciana Vargas', dni:'75819362', phone:'51999000005', plan:'Semestral', start:'2026-05-15', end:'2026-11-15', paid:500, method:'Transferencia' },
 { id:'6', name:'Mateo Ramírez', dni:'70294618', phone:'51999000006', plan:'Mensual', start:'2026-09-20', end:'2026-10-20', paid:100, method:'Yape/Plin' },
 { id:'7', name:'Antonella Castro', dni:'73916582', phone:'51999000007', plan:'Trimestral', start:'2026-10-15', end:'2027-01-15', paid:270, method:'Tarjeta' },
 { id:'8', name:'Nicolás Paredes', dni:'78124936', phone:'51999000008', plan:'Mensual', start:'2026-09-27', end:'2026-10-27', paid:100, method:'Efectivo' },
];
const seedMembers: Member[] = [
 ...memberFixtures.map((member, index): Member => ({ ...member, organizationId: 'atlas', homeBranchId: ['miraflores','miraflores','miraflores','barranco','norte','distrito','norte','barranco'][index], accessScope: index === 4 ? 'branch' : index === 1 ? 'gym' : 'network', recordedAt: member.start })),
 { id: 'atlas-future', name: 'Renzo Alvarado', dni: '77123456', phone: '51999000011', plan: 'Mensual', start: '2026-11-02', end: '2026-12-02', paid: 100, method: 'Efectivo', organizationId: 'atlas', homeBranchId: 'barranco', accessScope: 'network', recordedAt: '2026-10-26' },
 { id: 'central-1', name: 'Mariana León', dni: '80123456', phone: '51999000009', plan: '1 mes', start: '2026-10-01', end: '2026-11-01', paid: 90, method:'Yape/Plin', organizationId: 'central', homeBranchId: 'central', accessScope: 'branch', recordedAt: '2026-10-01' },
 { id: 'central-2', name: 'Javier Ruiz', dni: '80987654', phone: '51999000010', plan: '3 meses', start: '2026-07-20', end: '2026-10-20', paid: 240, method: 'Efectivo', organizationId: 'central', homeBranchId: 'central', accessScope: 'branch', recordedAt: '2026-07-20' },
];
export const initialMembers: Member[] = assignReceiptNumbers(seedMembers);
export function daysRemaining(end: string): number { return Math.ceil((Date.parse(end) - Date.parse(DEMO_DATE)) / 86400000); }
export function memberStatus(member: Member): MemberStatus {
 const periods = member.periods ?? [{ start: member.start, end: member.end }];
 const currentlyActive = periods.some(period => period.start <= DEMO_DATE && period.end >= DEMO_DATE);
 if (!currentlyActive) return periods.some(period => period.start > DEMO_DATE) ? 'scheduled' : 'expired';
 return daysRemaining(member.end) <= 7 ? 'expiring' : 'active';
}
export function whatsappLink(member: Member): string { return `https://wa.me/${member.phone}?text=${encodeURIComponent(`¡Hola, ${member.name.split(' ')[0]}! Te saludamos del gimnasio. Tu membresía ${member.plan.toLowerCase()} vence el ${member.end}. ¿Deseas renovar tu membresía?`)}`; }
