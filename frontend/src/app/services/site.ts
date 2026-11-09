import { apiRequest } from "./api";

export interface ApiBrand {
  name: string;
  logoUrl: string | null;
  theme: { preset: string; palette: Record<string, string> };
  aboutTitle: string;
  aboutParagraphs: string[];
  whatsappNumber: string;
  instagramHandle: string;
}

export interface ApiGalleryImage {
  id: number;
  url: string;
  title?: string;
}

export async function getSiteBrand(signal?: AbortSignal): Promise<ApiBrand | null> {
  return await apiRequest<ApiBrand | null>("/site/brand", { signal });
}

export async function updateSiteBrand(brand: ApiBrand, token: string): Promise<ApiBrand> {
  return await apiRequest<ApiBrand>("/site/brand", {
    method: "PUT",
    token,
    body: brand,
  });
}

export async function uploadBrandLogo(
  file: File,
  token: string,
): Promise<{ url: string; path: string | null }> {
  const body = new FormData();
  body.append("file", file);
  return await apiRequest<{ url: string; path: string | null }>("/site/brand/logo", {
    method: "POST",
    token,
    body,
  });
}

export async function listGalleryImages(signal?: AbortSignal): Promise<ApiGalleryImage[]> {
  return await apiRequest<ApiGalleryImage[]>("/site/gallery", { signal });
}

export async function uploadGalleryImage(
  file: File,
  token: string,
  title?: string,
): Promise<ApiGalleryImage> {
  const body = new FormData();
  body.append("file", file);
  if (title) body.append("title", title);
  return await apiRequest<ApiGalleryImage>("/site/gallery", {
    method: "POST",
    token,
    body,
  });
}

export async function updateGalleryImageTitle(
  id: number,
  title: string,
  token: string,
): Promise<ApiGalleryImage> {
  return await apiRequest<ApiGalleryImage>(`/site/gallery/${id}`, {
    method: "PATCH",
    token,
    body: { title },
  });
}

export async function deleteGalleryImage(id: number, token: string): Promise<void> {
  await apiRequest(`/site/gallery/${id}`, { method: "DELETE", token });
}
