import { useState, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { paymentMethodOptions } from '@/config/paymentMethods';
import { MemberPicker, type PickedMember } from '@/features/sales/components/MemberPicker';
import { useProducts } from '@/features/sales/hooks/useProducts';
import { useSalesMutations } from '@/features/sales/hooks/useSales';
import { addProduct, cartTotalCents, cartUnits, centsToText, changeQuantity, quantityOf, toSaleItems, type Cart } from '@/features/sales/services/cart';
import type { PaymentMethod } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { OptionCards } from '@/components/ui/option-cards';
import { formatCurrency } from '@/utils/formatCurrency';
import '@/features/sales/sales.css';

interface QuickSalePageProps {
  /** The branch where the user works: where the sale is registered. */
  branchId: string;
  onDone: (message: string) => void;
}

const METHOD_KEY = 'pulso.quickSale.method';

function rememberedMethod(): PaymentMethod {
  try {
    const saved = window.localStorage.getItem(METHOD_KEY);
    if (paymentMethodOptions.some((option) => option.value === saved)) return saved as PaymentMethod;
  } catch {
    // Storage may be unavailable (private window): the default is fine.
  }
  return 'cash';
}

/**
 * Selling at the counter: big buttons per product, a quantity with + and -, an optional member, and collect or put it on
 * pending (collected later). Made for speed on a phone or tablet: one tap per unit, the last payment method is remembered.
 */
export function QuickSalePage({ branchId, onDone }: QuickSalePageProps): ReactElement {
  const products = useProducts();
  const { sell } = useSalesMutations();
  const [cart, setCart] = useState<Cart>([]);
  const [member, setMember] = useState<PickedMember | null>(null);
  const [method, setMethodState] = useState<PaymentMethod>(rememberedMethod);
  // One id per sale being typed: a retry after a network error can never register it twice.
  const [saleId, setSaleId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState('');
  const list = products.data ?? [];
  const total = cartTotalCents(cart);
  const empty = cart.length === 0;

  function setMethod(next: PaymentMethod): void {
    setMethodState(next);
    try {
      window.localStorage.setItem(METHOD_KEY, next);
    } catch {
      // Not remembered; nothing else depends on it.
    }
  }

  async function submit(status: 'paid' | 'pending'): Promise<void> {
    setError('');
    try {
      await sell.mutateAsync({
        id: saleId,
        branch_id: branchId,
        status,
        ...(status === 'paid' ? { method } : {}),
        ...(member ? { member_id: member.id } : {}),
        items: toSaleItems(cart),
      });
      onDone(status === 'paid' ? `Venta cobrada: ${formatCurrency(centsToText(total))}.` : `Venta pendiente de ${formatCurrency(centsToText(total))} anotada a ${member?.full_name}.`);
      setCart([]);
      setMember(null);
      setSaleId(crypto.randomUUID());
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <div className="quick-sale">
      <section className="qs-products" aria-label="Productos">
        {products.isError && (
          <p className="error" role="alert">
            {describeError(products.error)}
          </p>
        )}
        {products.isSuccess && list.length === 0 && <p className="muted">No hay productos disponibles. El administrador los agrega en Productos.</p>}
        {list.map((product) => {
          const quantity = quantityOf(cart, product.id);
          return (
            <button key={product.id} type="button" className={`qs-product${quantity > 0 ? ' in-cart' : ''}`} onClick={() => setCart(addProduct(cart, product))}>
              <span className="qs-product-name">{product.name}</span>
              <span className="qs-product-price">{formatCurrency(product.price)}</span>
              {quantity > 0 && <span className="qs-product-qty" aria-label={`${quantity} en la venta`}>{quantity}</span>}
            </button>
          );
        })}
      </section>
      <aside className="card qs-cart" aria-label="Venta actual">
        <h2>
          <Icon name="cart" size={20} /> Venta
        </h2>
        {empty ? (
          <p className="muted">Toca un producto para agregarlo.</p>
        ) : (
          <ul className="qs-lines">
            {cart.map((line) => (
              <li key={line.productId}>
                <span className="qs-line-name">
                  <strong>{line.name}</strong>
                  <small>{formatCurrency(centsToText(line.unitCents))} c/u</small>
                </span>
                <span className="qs-stepper">
                  <IconButton icon="minus" label={`Quitar uno de ${line.name}`} onClick={() => setCart(changeQuantity(cart, line.productId, -1))} />
                  <output aria-label={`Cantidad de ${line.name}`}>{line.quantity}</output>
                  <IconButton icon="plus" label={`Agregar uno de ${line.name}`} onClick={() => setCart(changeQuantity(cart, line.productId, 1))} />
                </span>
                <strong className="qs-line-total">{formatCurrency(centsToText(line.unitCents * line.quantity))}</strong>
              </li>
            ))}
          </ul>
        )}
        <MemberPicker value={member} onChange={setMember} />
        <OptionCards label="Medio de pago" variant="chip" options={paymentMethodOptions} value={method} onChange={setMethod} />
        <div className="qs-total">
          <span>
            Total · {cartUnits(cart)} {cartUnits(cart) === 1 ? 'unidad' : 'unidades'}
          </span>
          <strong>{formatCurrency(centsToText(total))}</strong>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="qs-actions">
          <Button className="qs-pay" disabled={empty || sell.isPending} onClick={() => void submit('paid')}>
            <Icon name="cash" size={20} /> Cobrar {formatCurrency(centsToText(total))}
          </Button>
          <Button className="qs-pending" variant="secondary" disabled={empty || !member || sell.isPending} onClick={() => void submit('pending')}>
            Dejar pendiente
          </Button>
        </div>
        {!empty && (
          <Button variant="ghost" onClick={() => setCart([])}>
            Vaciar
          </Button>
        )}
      </aside>
    </div>
  );
}
