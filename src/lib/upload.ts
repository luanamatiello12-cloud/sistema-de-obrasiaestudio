import { sb, STORAGE_BUCKET } from './supabase';

export interface UploadResult {
  url: string; // URL pública do Storage, ou data-URL base64 como fallback
  usedFallback: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sobe a imagem para o Supabase Storage e devolve a URL pública.
 * Se o bucket não permitir upload (política ainda não configurada),
 * cai no comportamento antigo (base64) para não travar o usuário.
 */
export async function uploadImage(file: File, folder: string): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${safeName}`;

  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (!error) {
    const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, usedFallback: false };
  }

  const base64 = await fileToBase64(file);
  return { url: base64, usedFallback: true };
}
