// src/app/(app)/categories/page.tsx
import { getCategories } from '@/data/categories';
import CategoriesClient from '@/components/categories/CategoriesClient';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
      </div>
      <CategoriesClient categories={categories} />
    </>
  );
}
