/** The cart of a quick sale. Pure functions: the screen keeps the array, nothing here touches the network. */

export const MAX_QUANTITY = 99;
export const MAX_ITEMS = 30;

export interface CartProduct {
  id: string;
  name: string;
  /** Unit price as the API sends it ("8.50"). */
  price: string;
}

export interface CartLine {
  productId: string;
  name: string;
  unitCents: number;
  quantity: number;
}

export type Cart = CartLine[];

/** "8.50" -> 850. Prices come from the API with two decimals; anything else counts as 0. */
export function priceToCents(price: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price.trim());
  if (!match) return 0;
  return Number(match[1]) * 100 + Number(((match[2] ?? '') + '00').slice(0, 2));
}

/** 2650 -> "26.50". */
export function centsToText(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

/** Adds one unit of a product (a new line, or one more on its line). It never goes over the per-product limit. */
export function addProduct(cart: Cart, product: CartProduct): Cart {
  const found = cart.find((line) => line.productId === product.id);
  if (found) return changeQuantity(cart, product.id, 1);
  if (cart.length >= MAX_ITEMS) return cart;
  return [...cart, { productId: product.id, name: product.name, unitCents: priceToCents(product.price), quantity: 1 }];
}

/** Adds `delta` (negative to take away) to a line; a line that reaches 0 leaves the cart. */
export function changeQuantity(cart: Cart, productId: string, delta: number): Cart {
  return cart.flatMap((line) => {
    if (line.productId !== productId) return [line];
    const quantity = Math.min(MAX_QUANTITY, line.quantity + delta);
    return quantity < 1 ? [] : [{ ...line, quantity }];
  });
}

export function cartTotalCents(cart: Cart): number {
  return cart.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
}

export function cartUnits(cart: Cart): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export function quantityOf(cart: Cart, productId: string): number {
  return cart.find((line) => line.productId === productId)?.quantity ?? 0;
}

/** The items as the API takes them: the price is never sent, the server reads it from the catalog. */
export function toSaleItems(cart: Cart): { product_id: string; quantity: number }[] {
  return cart.map((line) => ({ product_id: line.productId, quantity: line.quantity }));
}
