---
name: frontend-architecture
description: Defines a Clean Architecture and reusable component structures for frontend. Especially useful when the user wants to organize pages, tables, lists, item cards, subpages, and modal dialogs in a predictable and maintainable way. Applies to React, Vue, Svelte, or similar frameworks.
license: Complete terms in LICENSE.txt
---

# Frontend Architecture Skill

This skill establishes a **standard architecture** and a **component pattern** for frontend, based on Clean Architecture. Its goal is to guarantee consistency, maintainability, and separation of concerns in projects of any size.

## When to use this skill?

- When starting a new frontend project with professional structure
- When the user mentions "clean architecture", "layers", "use cases"
- If the project requires screens with lists, tables, cards, subpages, and modal dialogs
- To maintain a consistent pattern across pages and components

## Clean Architecture in Frontend (Summary)

The architecture is organized in concentric layers, where dependencies point inward:

```
presentation layer (UI)
         ↓
use cases layer (business logic)
         ↓
repositories layer (abstractions)
         ↓
entities layer (domain models)
```

**Recommended folder structure (React example)**:

```
src/
├── domain/               # Innermost layer: entities
│   ├── entities/         # models (e.g.: Product, User)
│   └── repositories/     # repository interfaces (e.g.: IProductRepository)
├── application/          # use cases (grouped by module when many)
│   └── useCases/
│       ├── products/
│       │   ├── GetProductsUseCase.ts
│       │   ├── CreateProductUseCase.ts
│       │   └── DeleteProductUseCase.ts
│       └── users/
│           ├── GetUsersUseCase.ts
│           └── CreateUserUseCase.ts
├── infrastructure/       # concrete repository implementations
│   └── repositories/     # (e.g.: ApiProductRepository, LocalStorageRepository)
├── presentation/         # outer layer: modules organized by feature
│   ├── products/
│   │   ├── ProductsPage.tsx
│   │   └── components/
│   │       ├── ProductsTable.tsx
│   │       ├── ProductCard.tsx
│   │       └── CreateProductDialog.tsx
│   ├── users/
│   │   ├── UsersPage.tsx
│   │   └── components/
│   │       ├── UsersTable.tsx
│   │       └── CreateUserDialog.tsx
│   ├── shared/           # shared components across modules
│   │   └── components/
│   ├── hooks/            # hooks grouped by module when many
│   │   ├── products/
│   │   │   └── useProducts.ts
│   │   └── users/
│   │       └── useUsers.ts
│   └── contexts/         # if applicable
└── config/               # global configurations
```

> **Rule**: When a module grows in complexity (many use cases, hooks, components, repositories, etc.), all related files must be grouped in their own subfolder named after the module. This applies to any layer: `useCases/products/`, `hooks/products/`, `repositories/products/`, etc. Keep everything organized by module to maintain clarity at scale.

## Mandatory Component Pattern

All pages and their subcomponents **must follow this structure**:

### 1. Page (main page)

A page is a component that **contains the complete structure of a route**. It never contains domain logic, only use case orchestration and composition of child components.

**React example**:

```tsx
// presentation/products/ProductsPage.tsx
import { useProducts } from '../hooks/products/useProducts';
import { ProductsTable } from './components/ProductsTable';
import { CreateProductDialog } from './components/CreateProductDialog';
import { useState } from 'react';

export function ProductsPage() {
  const { products, loading, addProduct, deleteProduct } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add product
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <ProductsTable
          products={products}
          onDelete={deleteProduct}
        />
      )}

      <CreateProductDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={addProduct}
      />
    </div>
  );
}
```

### 2. Tables / Lists (separate component)

Every table or list must be an independent component. It receives data and callbacks as props. It never fetches directly.

**Example**:

```tsx
// presentation/products/components/ProductsTable.tsx
interface Product {
  id: string;
  name: string;
  price: number;
}

interface Props {
  products: Product[];
  onDelete: (id: string) => void;
}

export function ProductsTable({ products, onDelete }: Props) {
  return (
    <table className="w-full border">
      <thead>
        <tr><th>Name</th><th>Price</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.price}</td>
            <td>
              <button onClick={() => onDelete(p.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 3. Item Card / List item

If a list with cards is used instead of a table, each item goes in its own component.

```tsx
// presentation/products/components/ProductCard.tsx
export function ProductCard({ product, onDelete }: Props) {
  return (
    <div className="border rounded p-4 shadow">
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={() => onDelete(product.id)}>Delete</button>
    </div>
  );
}
```

### 4. Subpages

If a page has a subpage (e.g.: `ProductDetailPage` inside the products module), **it follows the same pattern**: it's called `Page`, is composed of components (tables, cards, dialogs), and is placed inside its module folder.

**Example**:

```tsx
// presentation/products/ProductDetailPage.tsx
export function ProductDetailPage() {
  return (
    <div>
      <h1>Product Detail</h1>
      <ProductInfo />
      <RelatedProductsList />
    </div>
  );
}
```

### 5. Always use Dialogs (modals)

Any creation or editing form must go inside a `Dialog` (modal). The dialog is an independent component that receives `open`, `onClose`, `onSave`.

**Example**:

```tsx
// presentation/products/components/CreateProductDialog.tsx
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
}

export function CreateProductDialog({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, price });
    onClose();
    setName('');
    setPrice(0);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2>Create Product</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border p-2 mb-2"
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full border p-2 mb-4"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## Hook to orchestrate use cases (optional but recommended)

Hooks act as a bridge between the UI and use cases. They contain state and call use cases.

```tsx
// presentation/hooks/products/useProducts.ts
import { useEffect, useState } from 'react';
import { GetProductsUseCase } from '../../../application/useCases/products/GetProductsUseCase';
import { CreateProductUseCase } from '../../../application/useCases/products/CreateProductUseCase';
import { DeleteProductUseCase } from '../../../application/useCases/products/DeleteProductUseCase';
import { Product } from '../../domain/entities/Product';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const getProductsUseCase = new GetProductsUseCase(/* repository */);
  const createProductUseCase = new CreateProductUseCase(/* repository */);
  const deleteProductUseCase = new DeleteProductUseCase(/* repository */);

  useEffect(() => {
    getProductsUseCase.execute().then(setProducts).finally(() => setLoading(false));
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct = await createProductUseCase.execute(product);
    setProducts(prev => [...prev, newProduct]);
  };

  const deleteProduct = async (id: string) => {
    await deleteProductUseCase.execute(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return { products, loading, addProduct, deleteProduct };
}
```

## Non-negotiable Rules

1. **Pages NEVER** contain domain logic or direct fetch.
2. **Tables/lists** are separate components, they receive data via props.
3. **Item cards** are also separate components.
4. **Subpages** follow exactly the same pattern as main pages.
5. **Every creation/editing form** must go inside a `Dialog`.
6. **Use cases** are classes or pure functions that don't depend on the UI.
7. **Repositories** are injected into use cases (dependency inversion).
8. **Each module** has its own folder with its page and a `components/` subfolder.
9. **When a module grows**, all its related files (use cases, hooks, repositories, components, etc.) must be grouped in subfolders named after the module across all layers.

## Quick Template for New Pages

When the user asks to create a new page, automatically generate:

1. `presentation/{module}/{Module}Page.tsx` (with layout, title, add button, and hook usage)
2. `presentation/{module}/components/{Module}Table.tsx` or `{Module}List.tsx`
3. `presentation/{module}/components/{Module}Dialog.tsx` (for create/edit)
4. `presentation/hooks/use{Module}.ts` (with corresponding use cases)
