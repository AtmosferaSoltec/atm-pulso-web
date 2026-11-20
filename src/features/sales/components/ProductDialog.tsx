import { useState, type FormEvent, type ReactElement } from 'react';
import { describeError } from '@/config/errorMessages';
import { useProductCategories } from '@/features/sales/hooks/useProductCategories';
import { useProductMutations } from '@/features/sales/hooks/useProducts';
import { NO_CATEGORY } from '@/features/sales/services/categories';
import type { Product } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { OptionCards } from '@/components/ui/option-cards';

interface ProductDialogProps {
  /** The product being edited; absent to create one. */
  product?: Product;
  onClose: () => void;
}

/** Creates or edits a product of the catalog: name, price and category. "Dar de baja" lives on the list. */
export function ProductDialog({ product, onClose }: ProductDialogProps): ReactElement {
  const { create, update } = useProductMutations();
  const categories = useProductCategories();
  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(product?.price ?? '');
  const [category, setCategory] = useState<string>(product?.category_id ?? NO_CATEGORY);
  const [error, setError] = useState('');
  const [id] = useState(() => crypto.randomUUID());
  const saving = create.isPending || update.isPending;
  const choices = categories.data ?? [];

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const amount = Number(price);
    if (name.trim() === '') {
      setError('Ingresa el nombre del producto.');
      return;
    }
    if (price.trim() === '' || !Number.isFinite(amount) || amount <= 0 || amount > 10000) {
      setError('Ingresa un precio válido (mayor que 0 y hasta 10 000).');
      return;
    }
    const body = { name: name.trim(), price: amount.toFixed(2), category_id: category === NO_CATEGORY ? null : category };
    try {
      if (product) await update.mutateAsync({ id: product.id, changes: body });
      else await create.mutateAsync({ id, ...body });
      onClose();
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <Dialog title={product ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="form-grid">
        <Field label="Nombre" required className="full">
          <Input placeholder="Ej. Batido de fresa" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Precio (S/)" required>
          <Input type="number" min="0.01" max="10000" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} />
        </Field>
        {choices.length > 0 && (
          <Field label="Categoría" as="div" className="full">
            <OptionCards
              label="Categoría"
              variant="chip"
              options={[...choices.map((item) => ({ value: item.id, label: item.name })), { value: NO_CATEGORY, label: 'Sin categoría' }]}
              value={category}
              onChange={setCategory}
            />
          </Field>
        )}
        {error && (
          <p role="alert" className="error full">
            {error}
          </p>
        )}
        <div className="form-actions full">
          <small className="required-note">
            <b>*</b> Obligatorio
          </small>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
