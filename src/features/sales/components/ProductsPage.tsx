import { useState, type CSSProperties, type ReactElement } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { describeError } from '@/config/errorMessages';
import { ProductDialog } from '@/features/sales/components/ProductDialog';
import { useProductMutations, useProducts } from '@/features/sales/hooks/useProducts';
import type { Product } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { formatCurrency } from '@/utils/formatCurrency';
import '@/features/sales/sales.css';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
}

/** One product of the catalog; the grip moves it (the order is the order of the buttons when selling). */
function ProductCard({ product, onEdit }: ProductCardProps): ReactElement {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li className={`plan-card${isDragging ? ' dragging' : ''}${product.is_active ? '' : ' inactive'}`} ref={setNodeRef} style={style}>
      <IconButton icon="grip" label={`Mover ${product.name}`} className="drag-handle" ref={setActivatorNodeRef} {...attributes} {...listeners} />
      <div className="plan-card-body">
        <strong>
          {product.name}
          {!product.is_active && (
            <span className="badge expired">
              <i />
              No disponible
            </span>
          )}
        </strong>
        <small>{formatCurrency(product.price)}</small>
      </div>
      <IconButton icon="edit" label={`Editar ${product.name}`} onClick={() => onEdit(product)} />
    </li>
  );
}

/** The gym's short catalog of things sold at the counter (admin). Only names and prices: no stock, no receipts. */
export function ProductsPage(): ReactElement {
  const products = useProducts({ includeInactive: true });
  const { update } = useProductMutations();
  const [dialog, setDialog] = useState<{ product?: Product } | null>(null);
  const [error, setError] = useState('');
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const list = products.data ?? [];

  async function move({ active, over }: DragEndEvent): Promise<void> {
    if (!over || active.id === over.id) return;
    const reordered = arrayMove(list, list.findIndex((item) => item.id === active.id), list.findIndex((item) => item.id === over.id));
    try {
      await Promise.all(reordered.flatMap((item, index) => (item.position === index ? [] : [update.mutateAsync({ id: item.id, changes: { position: index } })])));
    } catch (failure) {
      setError(describeError(failure));
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
          {products.isSuccess && list.length === 0 && <p className="muted">Aún no hay productos. Agrega los que vendes en el mostrador.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void move(event)}>
            <SortableContext items={list.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul className="plan-list">
                {list.map((item) => (
                  <ProductCard key={item.id} product={item} onEdit={(chosen) => setDialog({ product: chosen })} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </section>
      {dialog && <ProductDialog product={dialog.product} onClose={() => setDialog(null)} />}
    </div>
  );
}
