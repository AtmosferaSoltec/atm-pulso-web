import type { Member } from '@/features/members/types/member.types';

/** WhatsApp link with a renewal reminder. The API stores the 9-digit mobile; Peru's code is added here. */
export function whatsappLink(member: Pick<Member, 'phone' | 'full_name' | 'plan_label' | 'ends_on'>): string {
  const firstName = member.full_name.split(' ')[0];
  const text = `¡Hola, ${firstName}! Te saludamos del gimnasio. Tu membresía ${member.plan_label.toLowerCase()} vence el ${member.ends_on}. ¿Deseas renovar tu membresía?`;
  return `https://wa.me/51${member.phone}?text=${encodeURIComponent(text)}`;
}
