import { useSite, useStorageKey } from "../config/SiteContext";
import type { GalleryImage } from "../config/types";
export type { GalleryImage } from "../config/types";
import React, { createContext, useContext, useState } from "react";

interface GalleryContextValue {
  images: GalleryImage[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  updateTitle: (id: string, title: string) => void;
}

const GalleryContext = createContext<GalleryContextValue>({
  images: [],
  addImages: () => {},
  removeImage: () => {},
  updateTitle: () => {},
});

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const site = useSite();
  const STORAGE_KEY = useStorageKey("gallery_images");
  function save(next: GalleryImage[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const [images, setImages] = useState<GalleryImage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : site.catalog.gallery;
    } catch {
      return site.catalog.gallery;
    }
  });

  const addImages = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setImages((prev) => {
          const next = [...prev, { id: crypto.randomUUID(), url }];
          save(next);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      save(next);
      return next;
    });
  };

  const updateTitle = (id: string, title: string) => {
    setImages((prev) => {
      const next = prev.map((img) =>
        img.id === id ? { ...img, title: title || undefined } : img,
      );
      save(next);
      return next;
    });
  };

  return (
    <GalleryContext.Provider
      value={{ images, addImages, removeImage, updateTitle }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  return useContext(GalleryContext);
}
