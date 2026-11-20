import { useState, type CSSProperties, type ReactElement } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ApiError } from '@/config/apiClient';
import { describeError } from '@/config/errorMessages';
import { CategoriesCard } from '@/features/sales/components/CategoriesCard';
import { ProductDialog } from '@/features/sales/components/ProductDialog';
import { useProductCategories } from '@/features/sales/hooks/useProductCategories';
import { useProductMutations, useProducts } from '@/features/sales/hooks/useProducts';
import { groupByCategory, moveWithinGroup, positionChanges } from '@/features/sales/services/categories';
import type { Product } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { formatCurrency } from '@/utils/formatCurrency';
import '@/features/sales/sales.css';

interface ProductCardProps {
  product: Product;
  busy: boolean;
  onEdit: (product: Product) => void;
  onRetire: (product: Product) => void;
}

/** One product on sale; the grip moves it inside its category (the order of the buttons when selling). */
function ProductCard({ product, busy, onEdit, onRetire }: ProductCardProps): ReactElement {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li className={`plan-card product-row has-buttons${isDragging ? ' dragging' : ''}`} ref={setNodeRef} style={style}>
      <IconButton icon="grip" label={`Mover ${product.name}`} className="drag-handle" ref={setActivatorNodeRef} {...attributes} {...listeners} />
      <div className="plan-card-body">
        <strong>{product.name}</strong>
        <small>{formatCurrency(product.price)}</small>
      </div>
      <span className="product-actions">
        <IconButton icon="edit" label={`Editar ${product.name}`} onClick={() => onEdit(product)} />
        <Button variant="secondary" className="product-retire" disabled={busy} onClick={() => onRetire(product)} aria-label={`Dar de baja ${product.name}`}>
          <Icon name="archive" size={16} /> <span>Dar de baja</span>
        </Button>
      </span>
    </li>
  );
}

interface RetiredRowProps {
  product: Product;
  busy: boolean;
  onRestore: (product: Product) => void;
  onDelete: (product: Product) => Promise<void>;
}

/** A product no longer offered: it can come back, or be deleted when it was never sold. */
function RetiredRow({ product, busy, onRestore, onDelete }: RetiredRowProps): ReactElement {
  const [confirming, setConfirming] = useState(false);
  return (
    <li className={`plan-card product-row has-buttons retired${confirming ? ' confirming' : ''}`}>
      <div className="plan-card-body">
        <strong>{product.name}</strong>
        <small>
          {formatCurrency(product.price)}
          {product.category && ` · ${product.category.name}`}
        </small>
      </div>
      {confirming ? (
        <span className="product-actions" role="group" aria-label={`Confirmar eliminación de ${product.name}`}>
          <small>¿Eliminar para siempre?</small>
          <Button variant="secondary" disabled={busy} onClick={() => void onDelete(product).finally(() => setConfirming(false))}>
            Sí, eliminar
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            No
          </Button>
        </span>
      ) : (
        <span className="product-actions">
          <Button variant="secondary" disabled={busy} onClick={() => onRestore(product)} aria-label={`Reactivar ${product.name}`}>
            <Icon name="renewals" size={16} /> <span>Reactivar</span>
          </Button>
          <IconButton icon="trash" label={`Eliminar ${product.name}`} disabled={busy} onClick={() => setConfirming(true)} />
        </span>
      )}
    </li>
  );
}

/** The gym's short catalog of things sold at the counter (admin), grouped by category. No stock, no receipts. */
export function ProductsPage(): ReactElement {
  const products = useProducts({ includeInactive: true });
  const categories = useProductCategories();
  const { update, remove } = useProductMutations();
  const [dialog, setDialog] = useState<{ product?: Product } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const list = products.data ?? [];
  const active = list.filter((item) => item.is_active);
  const retired = list.filter((item) => !item.is_active);
  const groups = groupByCategory(active, categories.data ?? []);
  const busy = update.isPending || remove.isPending;

  async function move(group: Product[], { active: dragged, over }: DragEndEvent): Promise<void> {
    if (!over || dragged.id === over.id) return;
    const ordered = moveWithinGroup(list, group, String(dragged.id), String(over.id));
    try {
      await Promise.all(positionChanges(ordered).map(({ id, position }) => update.mutateAsync({ id, changes: { position } })));
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  async function setActive(product: Product, isActive: boolean): Promise<void> {
    setError('');
    setNotice('');
    try {
      await update.mutateAsync({ id: product.id, changes: { is_active: isActive } });
      setNotice(isActive ? `${product.name} vuelve a estar a la venta.` : `${product.name} quedó dado de baja. Ya no aparece al vender.`);
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  async function erase(product: Product): Promise<void> {
    setError('');
    setNotice('');
    try {
      await remove.mutateAsync(product.id);
      setNotice(`${product.name} fue eliminado.`);
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === 'PRODUCT_HAS_SALES') {
        setError(`${product.name} ya tiene ventas, así que no se puede eliminar: se queda dado de baja para conservar el historial.`);
      } else {
        setError(describeError(failure));
      }
    }
  }

  return (
    <div className="plans-page">
      <section className="card pricing-form">
        <div className="card-heading">
          <h2>Productos a la venta</h2>
          <Button onClick={() => setDialog({})}>
            <Icon name="plus" size={16} /> Nuevo producto
          </Button>
        </div>
        <div className="pricing-fields">
          {(products.isError || error) && (
            <p role="alert" className="error">
              {error || describeError(products.error)}
            </p>
          )}
          {notice && (
            <p role="status" className="muted">
              {notice}
            </p>
          )}
          {products.isSuccess && active.length === 0 && <p className="muted">Aún no hay productos a la venta. Agrega los que vendes en el mostrador.</p>}
          {groups.map((group) => (
            <div key={group.category?.id ?? 'none'} className="product-group">
              {(categories.data ?? []).length > 0 && <h3 className="product-group-title">{group.category?.name ?? 'Sin categoría'}</h3>}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void move(group.products, event)}>
                <SortableContext items={group.products.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <ul className="plan-list">
                    {group.products.map((item) => (
                      <ProductCard key={item.id} product={item} busy={busy} onEdit={(chosen) => setDialog({ product: chosen })} onRetire={(chosen) => void setActive(chosen, false)} />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          ))}
          {retired.length > 0 && (
            <details className="products-retired">
              <summary>Dados de baja ({retired.length})</summary>
              <ul className="plan-list">
                {retired.map((item) => (
                  <RetiredRow key={item.id} product={item} busy={busy} onRestore={(chosen) => void setActive(chosen, true)} onDelete={erase} />
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>
      <CategoriesCard products={list} />
      {dialog && <ProductDialog product={dialog.product} onClose={() => setDialog(null)} />}
    </div>
  );
}
