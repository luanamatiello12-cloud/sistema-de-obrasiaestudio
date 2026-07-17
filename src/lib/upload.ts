import { sb, STORAGE_BUCKET } from './supabase';
import { isDemo } from './data';
import { compressImage } from './image';

export interface UploadResult {
  url: string; // URL pública do Storage, ou data-URL comprimido (demo / fallback)
  usedFallback: boolean;
}

/**
 * Comprime a imagem e a sobe para o Supabase Storage, devolvendo a URL pública.
 * No modo demo (ou se o Storage recusar), devolve o data-URL comprimido —
 * o app nunca trava por causa de upload.
 */
export async function uploadImage(file: File, folder: string): Promise<UploadResult> {
  const compressed = await compressImage(file);

  if (isDemo()) {
    return { url: compressed, usedFallback: true };
  }

  const blob = await (await fetch(compressed)).blob();
  const path = `${folder}/${Date.now()}.jpg`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg',
  });

  if (!error) {
    const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, usedFallback: false };
  }
  return { url: compressed, usedFallback: true };
}
