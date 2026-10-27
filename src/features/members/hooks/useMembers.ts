import type { Member } from "@/features/members/types/member.types";
import { useDemoStore } from "@/store/demoStore";
import { canOperate } from "@/features/auth";
export function useMembers(organizationId: string): {
  members: Member[];
  saveMember: (member: Member) => void;
  updateMember: (member: Member) => void;
} {
  const { state, setState, currentUser } = useDemoStore();
  function saveMember(member: Member): void {
    if (
      !canOperate(currentUser, organizationId) ||
      member.organizationId !== organizationId
    )
      return;
    setState((current) => ({
      ...current,
      members: current.members.some((item) => item.id === member.id)
        ? current.members.map((item) => (item.id === member.id ? member : item))
        : [member, ...current.members],
    }));
  }
  function updateMember(member: Member): void {
    if (
      canOperate(currentUser, organizationId) &&
      member.organizationId === organizationId
    )
      setState((current) => ({
        ...current,
        members: current.members.map((item) =>
          item.id === member.id ? member : item,
        ),
      }));
  }
  return {
    members: state.members.filter(
      (member) => member.organizationId === organizationId,
    ),
    saveMember,
    updateMember,
  };
}
