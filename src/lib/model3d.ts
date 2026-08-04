import { sb, STORAGE_BUCKET } from './supabase';
import { isDemo } from './data';

const KEY = 'gp_obra_model3d';

/** URL do modelo 3D real do projeto (se o Engenheiro já subiu um). */
export async function getModel3dUrl(): Promise<string | null> {
  if (isDemo()) return localStorage.getItem(KEY);
  const { data } = await sb.from('config').select('valor').eq('chave', 'modelo_3d_url').maybeSingle();
  return data?.valor ?? null;
}

export async function setModel3dUrl(url: string): Promise<void> {
  if (isDemo()) {
    // URLs de objeto (blob:) não sobrevivem a um reload; só persiste caminhos/URLs reais.
    if (!url.startsWith('blob:')) localStorage.setItem(KEY, url);
    return;
  }
  await sb.from('config').upsert({ chave: 'modelo_3d_url', valor: url });
}

/** Sobe um arquivo .glb/.gltf. No demo devolve uma URL de objeto (sessão). */
export async function uploadModel(file: File): Promise<string> {
  if (isDemo()) return URL.createObjectURL(file);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `modelos/${Date.now()}_${safe}`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.name.endsWith('.glb') ? 'model/gltf-binary' : 'model/gltf+json',
  });
  if (error) return URL.createObjectURL(file);
  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
