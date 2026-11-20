/** Grouping and ordering of the catalog by category. Pure functions: no network, no React. */

export interface CategorizedProduct {
  id: string;
  position: number;
  is_active: boolean;
  category_id?: string | null;
}

export interface CategoryLike {
  id: string;
  name: string;
}

export interface ProductGroup<P> {
  /** null is "Sin categoría". */
  category: CategoryLike | null;
  products: P[];
}

/**
 * Splits products into groups in the order of the categories, with "Sin categoría" last. Empty groups are
 * dropped. A product whose category is not in the list (just deleted) falls into "Sin categoría".
 */
export function groupByCategory<P extends CategorizedProduct>(products: P[], categories: CategoryLike[]): ProductGroup<P>[] {
  const known = new Set(categories.map((category) => category.id));
  const groups: ProductGroup<P>[] = categories.map((category) => ({ category, products: products.filter((product) => product.category_id === category.id) }));
  groups.push({ category: null, products: products.filter((product) => !product.category_id || !known.has(product.category_id)) });
  return groups.filter((group) => group.products.length > 0);
}

/**
 * Moves one product inside its group and answers the new order of the whole catalog: the group's items keep the
 * slots they had in the full list, so products of other groups (and inactive ones) do not move.
 */
export function moveWithinGroup<P extends { id: string }>(all: P[], group: P[], activeId: string, overId: string): P[] {
  const from = group.findIndex((item) => item.id === activeId);
  const to = group.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return all;
  const reordered = [...group];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);
  const members = new Set(group.map((item) => item.id));
  let next = 0;
  return all.map((item) => (members.has(item.id) ? reordered[next++] : item));
}

/** The position changes to send: one per item whose index in the new order differs from its stored position. */
export function positionChanges<P extends { id: string; position: number }>(ordered: P[]): { id: string; position: number }[] {
  return ordered.flatMap((item, index) => (item.position === index ? [] : [{ id: item.id, position: index }]));
}

/** "Sin categoría" filter value of the counter screen. */
export const NO_CATEGORY = 'none';

/** Products shown under a category filter ("all", NO_CATEGORY or a category id). */
export function filterByCategory<P extends CategorizedProduct>(products: P[], filter: string): P[] {
  if (filter === 'all') return products;
  if (filter === NO_CATEGORY) return products.filter((product) => !product.category_id);
  return products.filter((product) => product.category_id === filter);
}
