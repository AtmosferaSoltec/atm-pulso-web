import { useCatalog } from '@/features/gym/hooks/useCatalog';

/**
 * Whether the current gym has more than one branch. With a single branch Pulso hides everything about branches
 * (switcher, columns, filters, assignments): the whole gym is that branch.
 */
export function useHasManyBranches(): boolean {
  return useCatalog().branches.length > 1;
}
