import { useState, type CSSProperties, type FormEvent, type ReactElement } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { describeError } from '@/config/errorMessages';
import { useProductCategories, useProductCategoryMutations } from '@/features/sales/hooks/useProductCategories';
import { positionChanges } from '@/features/sales/services/categories';
import type { Product, ProductCategory } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';

const MAX_NAME = 40;

function productsLabel(count: number): string {
  return count === 1 ? '1 producto' : `${count} productos`;
}

interface CategoryRowProps {
  category: ProductCategory;
  count: number;
  onError: (message: string) => void;
}

/** One category: rename in place, delete with a confirmation that says how many products it leaves without one. */
function CategoryRow({ category, count, onError }: CategoryRowProps): ReactElement {
  const { update, remove } = useProductCategoryMutations();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [name, setName] = useState(category.name);

  async function rename(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (name.trim() === '' || name.trim() === category.name) {
      setMode('view');
      return;
    }
    try {
      await update.mutateAsync({ id: category.id, changes: { name: name.trim() } });
      setMode('view');
    } catch (failure) {
      onError(describeError(failure));
    }
  }

  async function erase(): Promise<void> {
    try {
      await remove.mutateAsync(category.id);
    } catch (failure) {
      onError(describeError(failure));
      setMode('view');
    }
  }

  return (
    <li className={`plan-card product-row${isDragging ? ' dragging' : ''}${mode === 'delete' ? ' confirming' : ''}`} ref={setNodeRef} style={style}>
      <IconButton icon="grip" label={`Mover ${category.name}`} className="drag-handle" ref={setActivatorNodeRef} {...attributes} {...listeners} />
      {mode === 'edit' ? (
        <form className="category-edit" onSubmit={(event) => void rename(event)}>
          <Input aria-label="Nombre de la categoría" maxLength={MAX_NAME} value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          <IconButton icon="check" label="Guardar nombre" type="submit" disabled={update.isPending} />
          <IconButton
            icon="close"
            label="Cancelar"
            onClick={() => {
              setName(category.name);
              setMode('view');
            }}
          />
        </form>
      ) : (
        <>
          <div className="plan-card-body">
            <strong>{category.name}</strong>
            <small>{productsLabel(count)}</small>
          </div>
          {mode === 'delete' ? (
            <span className="product-actions" role="group" aria-label={`Confirmar eliminación de ${category.name}`}>
              <small>{count > 0 ? `¿Eliminar? ${productsLabel(count)} quedará${count === 1 ? '' : 'n'} sin categoría.` : '¿Eliminar?'}</small>
              <Button variant="secondary" disabled={remove.isPending} onClick={() => void erase()}>
                Sí, eliminar
              </Button>
              <Button variant="ghost" onClick={() => setMode('view')}>
                No
              </Button>
            </span>
          ) : (
            <span className="product-actions">
              <IconButton icon="edit" label={`Renombrar ${category.name}`} onClick={() => setMode('edit')} />
              <IconButton icon="trash" label={`Eliminar ${category.name}`} onClick={() => setMode('delete')} />
            </span>
          )}
        </>
      )}
    </li>
  );
}

interface CategoriesCardProps {
  /** The whole catalog (active or not), to count the products of each category. */
  products: Product[];
}

/** The gym's product categories (admin): add, rename, reorder and delete. */
export function CategoriesCard({ products }: CategoriesCardProps): ReactElement {
  const categories = useProductCategories();
  const { create, update } = useProductCategoryMutations();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const list = categories.data ?? [];

  async function add(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    if (name.trim() === '') return;
    try {
      await create.mutateAsync(name.trim());
      setName('');
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  async function move({ active, over }: DragEndEvent): Promise<void> {
    if (!over || active.id === over.id) return;
    const ordered = arrayMove(list, list.findIndex((item) => item.id === active.id), list.findIndex((item) => item.id === over.id));
    try {
      await Promise.all(positionChanges(ordered).map(({ id, position }) => update.mutateAsync({ id, changes: { position } })));
    } catch (failure) {
      setError(describeError(failure));
    }
  }

  return (
    <section className="card pricing-form">
      <div className="card-heading">
        <h2>Categorías</h2>
      </div>
      <div className="pricing-fields">
        <form className="category-add" onSubmit={(event) => void add(event)}>
          <Input aria-label="Nueva categoría" placeholder="Ej. Batidos" maxLength={MAX_NAME} value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" variant="secondary" disabled={create.isPending || name.trim() === ''}>
            <Icon name="plus" size={16} /> Agregar
          </Button>
        </form>
        {(categories.isError || error) && (
          <p role="alert" className="error">
            {error || describeError(categories.error)}
          </p>
        )}
        {categories.isSuccess && list.length === 0 && <p className="muted">Sin categorías: los productos se muestran en una sola lista.</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void move(event)}>
          <SortableContext items={list.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <ul className="plan-list">
              {list.map((item) => (
                <CategoryRow key={item.id} category={item} count={products.filter((product) => product.category_id === item.id).length} onError={setError} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
