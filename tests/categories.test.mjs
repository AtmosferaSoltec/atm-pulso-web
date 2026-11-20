import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterByCategory, groupByCategory, moveWithinGroup, positionChanges, NO_CATEGORY } from '../src/features/sales/services/categories.ts';

const batidos = { id: 'c1', name: 'Batidos' };
const agua = { id: 'c2', name: 'Agua' };
const p = (id, position, category_id = null, is_active = true) => ({ id, position, category_id, is_active });

test('groups follow the categories, "Sin categoría" last, empty groups dropped', () => {
  const products = [p('a', 0, 'c2'), p('b', 1), p('c', 2, 'c1'), p('d', 3, 'gone')];
  const groups = groupByCategory(products, [batidos, agua, { id: 'c3', name: 'Vacía' }]);
  assert.deepEqual(groups.map((group) => group.category?.name ?? null), ['Batidos', 'Agua', null]);
  assert.deepEqual(groups[2].products.map((item) => item.id), ['b', 'd'], 'an unknown category counts as none');
  assert.deepEqual(groupByCategory([], [batidos]), []);
});

test('moving inside a group keeps the other products in their slots', () => {
  const all = [p('a', 0, 'c1'), p('b', 1, 'c2'), p('c', 2, 'c1'), p('d', 3, 'c1')];
  const group = all.filter((item) => item.category_id === 'c1');
  const moved = moveWithinGroup(all, group, 'd', 'a');
  assert.deepEqual(moved.map((item) => item.id), ['d', 'b', 'a', 'c']);
  assert.deepEqual(positionChanges(moved), [
    { id: 'd', position: 0 },
    { id: 'a', position: 2 },
    { id: 'c', position: 3 },
  ]);
  assert.equal(moveWithinGroup(all, group, 'a', 'a'), all);
  assert.equal(moveWithinGroup(all, group, 'a', 'b'), all, 'a product of another group is not a target');
});

test('the counter filters by category', () => {
  const products = [p('a', 0, 'c1'), p('b', 1), p('c', 2, 'c2')];
  assert.equal(filterByCategory(products, 'all').length, 3);
  assert.deepEqual(filterByCategory(products, 'c1').map((item) => item.id), ['a']);
  assert.deepEqual(filterByCategory(products, NO_CATEGORY).map((item) => item.id), ['b']);
});
