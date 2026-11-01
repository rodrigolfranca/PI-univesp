import React, { createContext, useContext, useState } from "react";

export type Category = {
  id: number;
  name: string;
};

const initialCategories: Category[] = [
  { id: 1, name: "Facial" },
  { id: 2, name: "Corporal" },
  { id: 3, name: "Depilação" },
  { id: 4, name: "Outra" },
];

const STORAGE_KEY = "categories_data";

interface CategoriesContextValue {
  categories: Category[];
  addCategory: (name: string) => void;
  editCategory: (id: number, name: string) => void;
  deleteCategory: (id: number) => void;
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: initialCategories,
  addCategory: () => {},
  editCategory: () => {},
  deleteCategory: () => {},
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  function save(next: Category[]) {
    setCategories(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addCategory(name: string) {
    const newId = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    save([...categories, { id: newId, name }]);
  }

  function editCategory(id: number, name: string) {
    save(categories.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  function deleteCategory(id: number) {
    save(categories.filter((c) => c.id !== id));
  }

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, editCategory, deleteCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
