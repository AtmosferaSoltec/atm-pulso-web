import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addProduct, cartTotalCents, cartUnits, centsToText, changeQuantity, priceToCents, quantityOf, toSaleItems, MAX_ITEMS, MAX_QUANTITY } from '../src/features/sales/services/cart.ts';

const batido = { id: 'p1', name: 'Batido', price: '8.50' };
const agua = { id: 'p2', name: 'Agua', price: '2.00' };

test('money moves as cents without float drift', () => {
  assert.equal(priceToCents('8.50'), 850);
  assert.equal(priceToCents('8.5'), 850);
  assert.equal(priceToCents('10'), 1000);
  assert.equal(priceToCents('0.07'), 7);
  assert.equal(priceToCents('abc'), 0);
  assert.equal(centsToText(2650), '26.50');
  assert.equal(centsToText(5), '0.05');
  assert.equal(centsToText(priceToCents('19.99') * 3), '59.97');
});

test('tapping a product adds one unit, again adds one more', () => {
  let cart = addProduct([], batido);
  cart = addProduct(cart, batido);
  cart = addProduct(cart, agua);
  assert.equal(quantityOf(cart, 'p1'), 2);
  assert.equal(quantityOf(cart, 'p2'), 1);
  assert.equal(cartUnits(cart), 3);
  assert.equal(cartTotalCents(cart), 1900);
});

test('minus removes a unit and the line disappears at zero', () => {
  let cart = addProduct(addProduct([], batido), batido);
  cart = changeQuantity(cart, 'p1', -1);
  assert.equal(quantityOf(cart, 'p1'), 1);
  cart = changeQuantity(cart, 'p1', -1);
  assert.deepEqual(cart, []);
  assert.deepEqual(changeQuantity([], 'nope', -1), []);
});

test('quantity and number of products stop at the API limits', () => {
  let cart = [];
  for (let i = 0; i < MAX_QUANTITY + 5; i += 1) cart = addProduct(cart, agua);
  assert.equal(quantityOf(cart, 'p2'), MAX_QUANTITY);
  let many = [];
  for (let i = 0; i < MAX_ITEMS + 3; i += 1) many = addProduct(many, { id: `x${i}`, name: `P${i}`, price: '1.00' });
  assert.equal(many.length, MAX_ITEMS);
});

test('the sale sends product ids and quantities, never prices', () => {
  const cart = addProduct(addProduct(addProduct([], batido), batido), agua);
  assert.deepEqual(toSaleItems(cart), [
    { product_id: 'p1', quantity: 2 },
    { product_id: 'p2', quantity: 1 },
  ]);
});
