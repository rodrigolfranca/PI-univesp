import { useSite, useStorageKey } from "../config/SiteContext";
import { useAuth } from "./AuthContext";
import type { GalleryImage } from "../config/types";
import React, { createContext, useContext, useEffect, useState } from "react";
import { errorMessage } from "../services/api";
import {
  deleteGalleryImage,
  listGalleryImages,
  updateGalleryImageTitle,
  uploadGalleryImage,
} from "../services/site";

export type { GalleryImage } from "../config/types";

interface GalleryContextValue {
  images: GalleryImage[];
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => Promise<void>;
  updateTitle: (id: string, title: string) => Promise<void>;
}

const GalleryContext = createContext<GalleryContextValue>({
  images: [],
  addImages: async () => {},
  removeImage: async () => {},
  updateTitle: async () => {},
});

function toGalleryImage(image: { id: number; url: string; title?: string }): GalleryImage {
  return { id: String(image.id), url: image.url, ...(image.title ? { title: image.title } : {}) };
}

async function toFile(image: GalleryImage, index: number) {
  const response = await fetch(image.url);
  if (!response.ok) throw new Error("Não foi possível importar uma imagem antiga.");
  const blob = await response.blob();
  const extension = blob.type.split("/")[1] || "jpg";
  return new File([blob], `galeria-${index + 1}.${extension}`, { type: blob.type });
}

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const site = useSite();
  const { token, user } = useAuth();
  const storageKey = useStorageKey("gallery_images");
  const fallback = site.catalog.gallery;
  const [images, setImages] = useState<GalleryImage[]>(fallback);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    function readLegacy() {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? (JSON.parse(stored) as GalleryImage[]) : fallback;
      } catch {
        return fallback;
      }
    }

    async function load() {
      try {
        const remote = await listGalleryImages(controller.signal);
        if (!active) return;
        if (remote.length > 0) {
          setImages(remote.map(toGalleryImage));
          localStorage.removeItem(storageKey);
          return;
        }
        const legacy = readLegacy();
        setImages(legacy);
        if (!token || !user?.isAdmin || legacy.length === 0) return;
        const migrated: GalleryImage[] = [];
        for (let index = 0; index < legacy.length; index += 1) {
          try {
            const file = await toFile(legacy[index], index);
            const created = await uploadGalleryImage(file, token, legacy[index].title);
            migrated.push(toGalleryImage(created));
          } catch (error) {
            if (error instanceof Error && error.message.includes("importar")) continue;
            throw error;
          }
        }
        if (!active || migrated.length === 0) return;
        setImages(migrated);
        localStorage.removeItem(storageKey);
      } catch (error) {
        if (!active) return;
        setImages(readLegacy());
        console.warn(errorMessage(error));
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, token, user?.isAdmin]);

  async function addImages(files: File[]) {
    if (!token) throw new Error("Entre na sua conta para adicionar imagens.");
    const created: GalleryImage[] = [];
    for (const file of files) {
      const image = await uploadGalleryImage(file, token);
      created.push(toGalleryImage(image));
    }
    setImages((current) => [...current, ...created]);
  }

  async function removeImage(id: string) {
    if (!token) throw new Error("Entre na sua conta para remover imagens.");
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId)) throw new Error("Imagem inválida.");
    await deleteGalleryImage(numericId, token);
    setImages((current) => current.filter((image) => image.id !== id));
  }

  async function updateTitle(id: string, title: string) {
    if (!token) throw new Error("Entre na sua conta para editar imagens.");
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId)) throw new Error("Imagem inválida.");
    const updated = await updateGalleryImageTitle(numericId, title, token);
    setImages((current) =>
      current.map((image) => (image.id === id ? toGalleryImage(updated) : image)),
    );
  }

  return (
    <GalleryContext.Provider value={{ images, addImages, removeImage, updateTitle }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  return useContext(GalleryContext);
}
